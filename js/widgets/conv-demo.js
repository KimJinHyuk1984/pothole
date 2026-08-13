const INPUT = [[0,1,1,1,0],[0,1,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0]];
const FILTERS = { horizontal:[[0,0,0],[1,1,1],[0,0,0]], vertical:[[0,1,0],[0,1,0],[0,1,0]] };

function positions(size, stride, padding) {
  const padded = size + padding * 2;
  const count = Math.floor((padded - 3) / stride) + 1;
  return Array.from({length:count * count},(_,i)=>({row:Math.floor(i/count)*stride-padding,col:(i%count)*stride-padding,outRow:Math.floor(i/count),outCol:i%count,count}));
}
function cell(value, className="") { const el=document.createElement("span"); el.className=className; el.textContent=String(value); return el; }

export function mountConvDemo(root) {
  const body=root.querySelector("[data-widget-body]"), controls=root.querySelector("[data-widget-controls]"); if(!body||!controls)return;
  let filterKey="horizontal", stride=1, padding=0, step=0;
  const inputWrap=document.createElement("div"), outputWrap=document.createElement("div"), filterWrap=document.createElement("div");
  inputWrap.className="conv-matrix conv-input"; filterWrap.className="conv-matrix conv-filter"; outputWrap.className="conv-matrix conv-output";
  const calculation=document.createElement("output"); calculation.className="conv-calculation"; calculation.setAttribute("aria-live","polite");
  const stage=document.createElement("div"); stage.className="conv-stage";
  stage.innerHTML="<p class=\"conv-stage__label\">입력 5×5</p><p class=\"conv-stage__label\">필터 3×3</p><p class=\"conv-stage__label\">특성맵</p>";
  stage.append(inputWrap,filterWrap,outputWrap); body.replaceChildren(stage,calculation);

  function render() {
    const filter=FILTERS[filterKey], list=positions(5,stride,padding), current=list[Math.min(step,list.length-1)];
    inputWrap.style.setProperty("--cols","5"); inputWrap.replaceChildren();
    INPUT.flat().forEach((v,i)=>{const r=Math.floor(i/5),c=i%5; const active=current&&r>=current.row&&r<current.row+3&&c>=current.col&&c<current.col+3; inputWrap.append(cell(v,active?"is-window":""));});
    filterWrap.style.setProperty("--cols","3"); filterWrap.replaceChildren(...filter.flat().map(v=>cell(v,v?"is-filter":"")));
    outputWrap.style.setProperty("--cols",String(current?.count||1)); outputWrap.replaceChildren();
    let sum=0, terms=[];
    if(current){ for(let r=0;r<3;r++)for(let c=0;c<3;c++){const ir=current.row+r,ic=current.col+c;const value=INPUT[ir]?.[ic]??0;const weight=filter[r][c];sum+=value*weight;terms.push(`${value}×${weight}`);} }
    list.forEach((pos,i)=>{let value="·";if(i<=step){let n=0;for(let r=0;r<3;r++)for(let c=0;c<3;c++)n+=(INPUT[pos.row+r]?.[pos.col+c]??0)*filter[r][c];value=n;} const el=cell(value,i===Math.min(step,list.length-1)?"is-current":""); outputWrap.append(el);});
    calculation.textContent=current?`${terms.join(" + ")} = ${sum}`:"한 칸 밀기를 눌러 계산을 시작하세요.";
    next.disabled=step>=list.length-1; reset.disabled=step===0;
  }
  const makeToggle=(label,onClick)=>{const b=document.createElement("button");b.type="button";b.className="control-button";b.textContent=label;b.addEventListener("click",onClick);return b;};
  const horizontal=makeToggle("가로 탐지",()=>{filterKey="horizontal";step=0;sync();}); const vertical=makeToggle("세로 탐지",()=>{filterKey="vertical";step=0;sync();});
  const strideButton=makeToggle("스트라이드 1",()=>{stride=stride===1?2:1;strideButton.textContent=`스트라이드 ${stride}`;strideButton.setAttribute("aria-pressed",String(stride===2));step=0;render();});
  const paddingButton=makeToggle("패딩 없음",()=>{padding=padding?0:1;paddingButton.textContent=padding?"패딩 1":"패딩 없음";paddingButton.setAttribute("aria-pressed",String(Boolean(padding)));step=0;render();});
  const next=makeToggle("한 칸 밀기",()=>{step+=1;render();}); const reset=makeToggle("처음으로",()=>{step=0;render();});
  function sync(){horizontal.setAttribute("aria-pressed",String(filterKey==="horizontal"));vertical.setAttribute("aria-pressed",String(filterKey==="vertical"));render();}
  controls.replaceChildren(horizontal,vertical,strideButton,paddingButton,next,reset); sync(); root.dataset.mounted="true";
}
document.querySelectorAll('[data-widget="conv-demo"]').forEach(mountConvDemo);
