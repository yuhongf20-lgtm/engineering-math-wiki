"use strict";
// Test-only numeric checks; no new website calculators are exposed.
(function(root){
 function runPackExampleTests(){
  const passed=[];
  const check=(ok,title)=>{if(!ok)throw Error(title);passed.push(title);};
  const near=(a,b,tol=1e-12)=>Math.abs(a-b)<=tol;
  let xl=1,xu=2;
  const fractions=[[4,3],[7,5],[24,17],[41,29],[140,99],[239,169]];
  for(let k=0;k<6;k++){
   const fl=xl*xl-2,fu=xu*xu-2;
   const xr=xl-fl*(xu-xl)/(fu-fl),fr=xr*xr-2;
   const [num,den]=fractions[k];
   check(near(xr,num/den),"假位第 "+(k+1)+" 次插值對照精確分數");
   check(near(fr,(num*num-2*den*den)/(den*den)),"假位第 "+(k+1)+" 次殘差核對");
   check(k===5?Math.abs(fr)<=1e-4:Math.abs(fr)>1e-4,"假位停止條件第 "+(k+1)+" 次");
   if(Math.sign(fl)!==Math.sign(fr))xu=xr;else xl=xr;
  }
  const A=[[0,2,1],[2,1,1],[1,1,3]],b=[7,7,12],truth=[1,2,3];
  check(A.every((row,i)=>row.reduce((s,a,j)=>s+a*truth[j],0)===b[i]),"三元系統精確解代回");
  let M=A.map((r,i)=>[...r,b[i]]);
  const same=(actual,expected)=>actual.every((r,i)=>r.every((v,j)=>near(v,expected[i][j])));
  const add=(target,pivot,m)=>{M[target]=M[target].map((v,j)=>v-m*M[pivot][j]);};
  [M[0],M[1]]=[M[1],M[0]];add(2,0,.5);
  check(same(M,[[2,1,1,7],[0,2,1,7],[0,.5,2.5,8.5]]),"高斯換列及第一欄消去");
  add(2,1,.25);
  check(same(M,[[2,1,1,7],[0,2,1,7],[0,0,2.25,6.75]]),"高斯第二欄消去");
  const x=[0,0,0];
  for(let i=2;i>=0;i--){let rhs=M[i][3];for(let j=i+1;j<3;j++)rhs-=M[i][j]*x[j];x[i]=rhs/M[i][i];}
  check(x.every((v,i)=>near(v,truth[i])),"高斯向後代入");
  M=A.map((r,i)=>[...r,b[i]]);[M[0],M[1]]=[M[1],M[0]];
  M[0]=M[0].map(v=>v/2);add(2,0,1);
  check(same(M,[[1,.5,.5,3.5],[0,2,1,7],[0,.5,2.5,8.5]]),"喬登第一主元正規化及消去");
  M[1]=M[1].map(v=>v/2);add(0,1,.5);add(2,1,.5);
  check(same(M,[[1,0,.25,1.75],[0,1,.5,3.5],[0,0,2.25,6.75]]),"喬登第二主元上下消去");
  M[2]=M[2].map(v=>v/2.25);add(0,2,.25);add(1,2,.5);
  check(same(M,[[1,0,0,1],[0,1,0,2],[0,0,1,3]]),"喬登最終 RREF");
  let x1=0,x2=0;
  const gs=[[3/2,5/3,5/3],[13/12,35/18,5/18],[73/72,215/108,5/108],[433/432,1295/648,5/648]];
  for(let k=0;k<4;k++){
   x1=(6-x2)/4;x2=(8-2*x1)/3;
   const residual=Math.max(Math.abs(6-4*x1-x2),Math.abs(8-2*x1-3*x2));
   check(near(x1,gs[k][0])&&near(x2,gs[k][1])&&near(residual,gs[k][2]),"賽德第 "+(k+1)+" 輪向量與殘差");
   check(k===3?residual<=.01:residual>.01,"賽德第 "+(k+1)+" 輪停止條件");
  }
  return passed;
 }
 if(typeof module!=="undefined"&&module.exports){module.exports=runPackExampleTests;if(require.main===module)console.log(runPackExampleTests().map(t=>"PASS "+t).join("\n"));}
 else root.runPackExampleTests=runPackExampleTests;
})(globalThis);
