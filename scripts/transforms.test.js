"use strict";
(function(root){
 function runTransformTests(api){
  const passed=[],check=(ok,title)=>{if(!ok)throw Error(title);passed.push(title);};
  const near=(x,y,t=1e-11)=>Math.abs(x-y)<=t*Math.max(1,Math.abs(y));
  const rejects=(fn,title)=>{let caught=false;try{fn();}catch{caught=true;}check(caught,title);};
  let r=api.laplaceTransform({functionId:"exponential",a:2,sigma:1,omega:0});
  check(r.valid&&near(r.real,1/3)&&r.imag===0,"Laplace exp(-2t), s=1 -> 1/3");
  r=api.laplaceTransform({functionId:"exponential",a:2,sigma:1,omega:1});
  check(r.valid&&near(r.real,.3)&&near(r.imag,-.1),"Laplace exp(-2t), s=1+j -> .3-.1j");
  r=api.laplaceTransform({functionId:"sine",b:2,sigma:1,omega:0});
  check(r.valid&&near(r.real,.4)&&r.imag===0,"Laplace sin(2t), s=1 -> .4");
  r=api.laplaceTransform({functionId:"sine",b:2,sigma:1,omega:1});
  check(r.valid&&near(r.real,.4)&&near(r.imag,-.2),"Laplace sine complex square");
  for(const [functionId,re,im]of [["constant",.5,-.5],["ramp",0,-.5]]){
   r=api.laplaceTransform({functionId,sigma:1,omega:1});check(r.valid&&near(r.real,re)&&near(r.imag,im),"Laplace complex "+functionId);
  }
  for(const p of [{functionId:"exponential",a:2,sigma:-2},{functionId:"exponential",a:2,sigma:-3},{functionId:"constant",sigma:0},{functionId:"ramp",sigma:-1},{functionId:"sine",b:2,sigma:0}]){
   r=api.laplaceTransform({...p,omega:0});check(!r.valid&&r.real===null&&r.imag===null&&r.complex===null,"Laplace ROC blocks numeric value "+JSON.stringify(p));
  }
  r=api.laplaceTransform({functionId:"exponential",a:-2,sigma:3,omega:0});
  check(r.valid&&near(r.real,1),"Laplace negative a with valid ROC");
  rejects(()=>api.laplaceTransform({functionId:"sine",b:0}),"Laplace b=0 rejected");
  rejects(()=>api.laplaceTransform({functionId:"sine",b:-1}),"Laplace b<0 rejected");
  rejects(()=>api.laplaceTransform({a:NaN}),"Laplace a NaN rejected");
  rejects(()=>api.laplaceTransform({sigma:Infinity}),"Laplace sigma Infinity rejected");
  rejects(()=>api.laplaceTransform({omega:"1"}),"Laplace string omega rejected");
  rejects(()=>api.laplaceTransform({functionId:"arbitrary"}),"Laplace unsupported function rejected");
  rejects(()=>api.laplaceTransform({functionId:"ramp",sigma:1e308,omega:0}),"Laplace numeric overflow reported");
  for(const [functionId,a,omega,expected]of [["exponential",1,0,2],["exponential",1,1,1],["gaussian",1,0,Math.sqrt(Math.PI)]]){
   r=api.fourierTransform({functionId,a,omega});check(r.valid&&near(r.value,expected)&&r.imag===0,"Fourier specified "+functionId+" omega="+omega);
  }
  r=api.fourierTransform({functionId:"rectangle",A:2,T:3,omega:0});
  check(r.value===6&&r.magnitude===6&&!r.substitution.includes("/0"),"Fourier rectangle omega=0 -> AT=6");
  r=api.fourierTransform({functionId:"rectangle",A:2,T:3,omega:Math.PI/3});
  check(near(r.value,12/Math.PI),"Fourier rectangle nonzero frequency");
  r=api.fourierTransform({functionId:"rectangle",A:2,T:3,omega:Math.PI});
  check(near(r.value,-4/Math.PI)&&near(r.magnitude,4/Math.PI),"Fourier signed result vs magnitude");
  r=api.fourierTransform({functionId:"rectangle",A:2,T:3,omega:1e-14});check(near(r.value,6),"Fourier near-zero stable sinc");
  r=api.fourierTransform({functionId:"rectangle",A:-2,T:3,omega:0});check(r.value===-6&&r.magnitude===6,"Fourier negative amplitude permitted");
  for(const functionId of ["exponential","gaussian","rectangle"]){
   const pos=api.fourierTransform({functionId,omega:1.2}),neg=api.fourierTransform({functionId,omega:-1.2});
   check(near(pos.value,neg.value),"Fourier even symmetry "+functionId);
  }
  for(const parameters of [{a:0},{a:-1},{a:NaN},{omega:Infinity},{functionId:"rectangle",T:0},{functionId:"rectangle",T:-1},{functionId:"rectangle",A:NaN},{functionId:"arbitrary"}]){
   rejects(()=>api.fourierTransform(parameters),"Fourier invalid parameters "+JSON.stringify(parameters));
  }
  const simpson=(f,left,right,n)=>{
   const h=(right-left)/n;let sum=f(left)+f(right);
   for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(left+i*h);
   return sum*h/3;
  };
  const re=simpson(t=>Math.exp(-3*t)*Math.cos(t),0,20,8000);
  const im=simpson(t=>-Math.exp(-3*t)*Math.sin(t),0,20,8000);
  check(near(re,.3,1e-9)&&near(im,-.1,1e-9),"Laplace independent complex numerical integral");
  check(near(2*simpson(t=>Math.exp(-t)*Math.cos(t),0,30,12000),1,1e-9),"Fourier exponential independent integral");
  check(near(simpson(t=>Math.exp(-t*t),-10,10,8000),Math.sqrt(Math.PI),1e-10),"Fourier Gaussian independent integral");
  check(near(simpson(t=>2*Math.cos(Math.PI*t/3),-1.5,1.5,4000),12/Math.PI,1e-10),"Fourier rectangle independent integral");
  return passed;
 }
 if(typeof module!=="undefined"&&module.exports){module.exports=runTransformTests;if(require.main===module)console.log(runTransformTests(require("../assets/js/calculators.js")).map(t=>"PASS "+t).join("\n"));}
 else root.runTransformTests=runTransformTests;
})(globalThis);
