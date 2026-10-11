const PHOTO_GRIDS=[[5,7],[4,5],[5,5],[4,5],[3,2],[5,7],[5,6],[4,6],[3,5],[3,3],[2,2],[3,1]];
function photoForWord(w,extra=''){
 let ui=DATA.findIndex(u=>u.words.includes(w)),wi=DATA[ui].words.indexOf(w);let [cols,rows]=PHOTO_GRIDS[ui],src='assets/words-'+ui+'.png';
 if(ui===5&&(wi===2||wi===6)){src='assets/food-fix.png';cols=2;rows=1;wi=wi===2?0:1}
 if(w[0]==='Feather'){src='assets/feather.png';cols=1;rows=1;wi=0}
 const box=document.createElement('span');box.className='word-photo '+extra;box.setAttribute('role','img');box.setAttribute('aria-label',w[1]);
 const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';img.decoding='async';img.style.width=(cols*100)+'%';img.style.height=(rows*100)+'%';img.style.left=-(wi%cols*100)+'%';img.style.top=-(Math.floor(wi/cols)*100)+'%';box.append(img);
 // Text on calendar photos is covered so spelling tasks cannot reveal the answer.
 if(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|English)$/.test(w[0])){const mask=document.createElement('span');mask.className='photo-label-mask';mask.textContent=w[1];box.append(mask)}
 return box;
}
