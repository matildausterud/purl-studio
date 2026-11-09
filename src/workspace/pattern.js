// Pure repeat data. No yarn strand is implicitly assigned to a motif color.
export function patternCell(p,x,y){switch(p.type){
 case 'solid':return 0;
 case 'checker':return (Math.floor(x/p.checker.width)+Math.floor(y/p.checker.height))%2;
 case 'stripes':return Math.floor((p.stripes.direction==='vertical'?x:y)/p.stripes.size)%2;
 case 'dots':{const n=p.dots.spacing,r={small:1,medium:2,large:3}[p.dots.size];const dx=(x%n)-(n-1)/2,dy=(y%n)-(n-1)/2;return dx*dx+dy*dy<=r*r?1:0;}
 case 'diamonds':{const n=p.diamonds.size*2;return Math.abs((x%n)-(n-1)/2)+Math.abs((y%n)-(n-1)/2)<p.diamonds.size?1:0;}
 default:return 0;
}}
export function repeatDimensions(p){return p.type==='checker'?[p.checker.width*2,p.checker.height*2]:p.type==='stripes'?(p.stripes.direction==='horizontal'?[1,p.stripes.size*2]:[p.stripes.size*2,1]):p.type==='dots'?[p.dots.spacing,p.dots.spacing]:p.type==='diamonds'?[p.diamonds.size*2,p.diamonds.size*2]:[1,1];}
export function chartSVG(p,{size=28,grid=false,showPattern=true}={}){let rects='';for(let y=0;y<size;y++)for(let x=0;x<size;x++)rects+=`<rect x="${x*10}" y="${y*10}" width="10" height="10" fill="${p.colors[showPattern?patternCell(p,x,y):0].hex}" ${grid?'stroke="#24242455" stroke-width=".5"':''}/>`;return `<svg class="chart-preview" viewBox="0 0 ${size*10} ${size*10}" role="img" aria-label="Schematisk mönstervy, en ruta per maska">${rects}</svg>`;}
