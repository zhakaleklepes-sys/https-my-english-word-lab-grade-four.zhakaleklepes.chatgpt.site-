const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

async function ensureSchema(db){await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student TEXT NOT NULL,
    student_key TEXT NOT NULL,
    unit INTEGER NOT NULL CHECK (unit BETWEEN 0 AND 7),
    score INTEGER NOT NULL CHECK (score >= 0),
    total INTEGER NOT NULL CHECK (total > 0),
    percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
    created_at TEXT NOT NULL
  )`),
  db.prepare('CREATE INDEX IF NOT EXISTS idx_test_results_student_unit_date ON test_results (student_key, unit, created_at)'),
  db.prepare('CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results (created_at)')
]);}

async function resultsApi(request,env){
  if(!env.DB)return json({error:'Database unavailable'},503);
  await ensureSchema(env.DB);
  await env.DB.prepare("DELETE FROM test_results WHERE created_at < datetime('now','-30 days')").run();
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/results/import'&&request.method==='POST'){
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
    const incoming=Array.isArray(body.results)?body.results.slice(0,500):[];
    const cutoff=Date.now()-30*24*60*60*1000,latest=Date.now()+5*60*1000,statements=[];
    for(const item of incoming){
      const student=String(item.student||'').trim().replace(/\s+/g,' ').slice(0,80),unit=Number(item.unit),score=Number(item.score),total=Number(item.total),time=Date.parse(item.date);
      if(student.length<2||!Number.isInteger(unit)||unit<0||unit>7||!Number.isInteger(score)||!Number.isInteger(total)||total<1||score<0||score>total||!Number.isFinite(time)||time<cutoff||time>latest)continue;
      const percent=Math.round(score/total*100),createdAt=new Date(time).toISOString(),studentKey=student.toLocaleLowerCase();
      statements.push(env.DB.prepare('INSERT INTO test_results (student, student_key, unit, score, total, percent, created_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM test_results WHERE student_key=? AND unit=? AND score=? AND total=? AND created_at=?)').bind(student,studentKey,unit,score,total,percent,createdAt,studentKey,unit,score,total,createdAt));
    }
    if(statements.length)await env.DB.batch(statements);
    return json({ok:true,imported:statements.length});
  }
  if(request.method==='GET'){
    const query=await env.DB.prepare('SELECT student, unit, score, total, percent, created_at AS date FROM test_results ORDER BY created_at ASC LIMIT 5000').all();
    return json({results:query.results||[]});
  }
  if(request.method==='POST'){
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
    const student=String(body.student||'').trim().replace(/\s+/g,' ').slice(0,80);
    const unit=Number(body.unit),score=Number(body.score),total=Number(body.total);
    if(student.length<2||!Number.isInteger(unit)||unit<0||unit>7||!Number.isInteger(score)||!Number.isInteger(total)||total<1||score<0||score>total)return json({error:'Invalid result'},400);
    const percent=Math.round(score/total*100),createdAt=new Date().toISOString();
    await env.DB.prepare('INSERT INTO test_results (student, student_key, unit, score, total, percent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(student,student.toLocaleLowerCase(),unit,score,total,percent,createdAt).run();
    return json({ok:true,result:{student,unit,score,total,percent,date:createdAt}},201);
  }
  return json({error:'Method not allowed'},405);
}

export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/results'||url.pathname==='/api/results/import')return resultsApi(request,env);if(env.ASSETS)return env.ASSETS.fetch(request);return new Response('Not found',{status:404})}};
