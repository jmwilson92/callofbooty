(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ml="169",Dd=0,Zl=1,Nd=2,Ch=1,Ph=2,si=3,Vn=0,tn=1,Rn=2,Ti=0,ms=1,Jl=2,Ql=3,tc=4,Od=5,Gi=100,Ud=101,Fd=102,Bd=103,zd=104,Hd=200,Gd=201,kd=202,Vd=203,Ma=204,va=205,Wd=206,Xd=207,Yd=208,qd=209,Kd=210,jd=211,$d=212,Zd=213,Jd=214,ya=0,Sa=1,Ea=2,Ms=3,Ta=4,Aa=5,wa=6,ba=7,Lh=0,Qd=1,tu=2,Ai=0,eu=1,nu=2,iu=3,su=4,ru=5,ou=6,au=7,ec="attached",lu="detached",Ih=300,vs=301,ys=302,Ra=303,Ca=304,Mo=306,Ss=1e3,Si=1001,co=1002,je=1003,Dh=1004,er=1005,an=1006,eo=1007,ai=1008,ci=1009,Nh=1010,Oh=1011,dr=1012,gl=1013,Wi=1014,Ln=1015,xr=1016,_l=1017,xl=1018,Es=1020,Uh=35902,Fh=1021,Bh=1022,fn=1023,zh=1024,Hh=1025,gs=1026,Ts=1027,Ml=1028,vl=1029,Gh=1030,yl=1031,Sl=1033,no=33776,io=33777,so=33778,ro=33779,Pa=35840,La=35841,Ia=35842,Da=35843,Na=36196,Oa=37492,Ua=37496,Fa=37808,Ba=37809,za=37810,Ha=37811,Ga=37812,ka=37813,Va=37814,Wa=37815,Xa=37816,Ya=37817,qa=37818,Ka=37819,ja=37820,$a=37821,oo=36492,Za=36494,Ja=36495,kh=36283,Qa=36284,tl=36285,el=36286,ur=2300,fr=2301,Ro=2302,nc=2400,ic=2401,sc=2402,cu=2500,hu=0,Vh=1,nl=2,du=3200,uu=3201,Wh=0,fu=1,yi="",Be="srgb",ze="srgb-linear",El="display-p3",vo="display-p3-linear",ho="linear",ge="srgb",uo="rec709",fo="p3",Ki=7680,rc=519,pu=512,mu=513,gu=514,Xh=515,_u=516,xu=517,Mu=518,vu=519,il=35044,oc="300 es",li=2e3,po=2001;class Is{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,t);t.target=null}}}const Ge=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let ac=1234567;const or=Math.PI/180,As=180/Math.PI;function In(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ge[r&255]+Ge[r>>8&255]+Ge[r>>16&255]+Ge[r>>24&255]+"-"+Ge[t&255]+Ge[t>>8&255]+"-"+Ge[t>>16&15|64]+Ge[t>>24&255]+"-"+Ge[e&63|128]+Ge[e>>8&255]+"-"+Ge[e>>16&255]+Ge[e>>24&255]+Ge[n&255]+Ge[n>>8&255]+Ge[n>>16&255]+Ge[n>>24&255]).toLowerCase()}function Ve(r,t,e){return Math.max(t,Math.min(e,r))}function Tl(r,t){return(r%t+t)%t}function yu(r,t,e,n,i){return n+(r-t)*(i-n)/(e-t)}function Su(r,t,e){return r!==t?(e-r)/(t-r):0}function ar(r,t,e){return(1-e)*r+e*t}function Eu(r,t,e,n){return ar(r,t,1-Math.exp(-e*n))}function Tu(r,t=1){return t-Math.abs(Tl(r,t*2)-t)}function Au(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*(3-2*r))}function wu(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*r*(r*(r*6-15)+10))}function bu(r,t){return r+Math.floor(Math.random()*(t-r+1))}function Ru(r,t){return r+Math.random()*(t-r)}function Cu(r){return r*(.5-Math.random())}function Pu(r){r!==void 0&&(ac=r);let t=ac+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Lu(r){return r*or}function Iu(r){return r*As}function Du(r){return(r&r-1)===0&&r!==0}function Nu(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Ou(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Uu(r,t,e,n,i){const s=Math.cos,o=Math.sin,a=s(e/2),l=o(e/2),c=s((t+n)/2),h=o((t+n)/2),d=s((t-n)/2),u=o((t-n)/2),f=s((n-t)/2),m=o((n-t)/2);switch(i){case"XYX":r.set(a*h,l*d,l*u,a*c);break;case"YZY":r.set(l*u,a*h,l*d,a*c);break;case"ZXZ":r.set(l*d,l*u,a*h,a*c);break;case"XZX":r.set(a*h,l*m,l*f,a*c);break;case"YXY":r.set(l*f,a*h,l*m,a*c);break;case"ZYZ":r.set(l*m,l*f,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Cn(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function le(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}const Fe={DEG2RAD:or,RAD2DEG:As,generateUUID:In,clamp:Ve,euclideanModulo:Tl,mapLinear:yu,inverseLerp:Su,lerp:ar,damp:Eu,pingpong:Tu,smoothstep:Au,smootherstep:wu,randInt:bu,randFloat:Ru,randFloatSpread:Cu,seededRandom:Pu,degToRad:Lu,radToDeg:Iu,isPowerOfTwo:Du,ceilPowerOfTwo:Nu,floorPowerOfTwo:Ou,setQuaternionFromProperEuler:Uu,normalize:le,denormalize:Cn};class jt{constructor(t=0,e=0){jt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ve(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*i+t.x,this.y=s*i+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Wt{constructor(t,e,n,i,s,o,a,l,c){Wt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c)}set(t,e,n,i,s,o,a,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=a,h[3]=e,h[4]=s,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],m=n[8],_=i[0],p=i[3],g=i[6],x=i[1],M=i[4],y=i[7],A=i[2],w=i[5],E=i[8];return s[0]=o*_+a*x+l*A,s[3]=o*p+a*M+l*w,s[6]=o*g+a*y+l*E,s[1]=c*_+h*x+d*A,s[4]=c*p+h*M+d*w,s[7]=c*g+h*y+d*E,s[2]=u*_+f*x+m*A,s[5]=u*p+f*M+m*w,s[8]=u*g+f*y+m*E,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*s*h+n*a*l+i*s*c-i*o*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=h*o-a*c,u=a*l-h*s,f=c*s-o*l,m=e*d+n*u+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/m;return t[0]=d*_,t[1]=(i*c-h*n)*_,t[2]=(a*n-i*o)*_,t[3]=u*_,t[4]=(h*e-i*l)*_,t[5]=(i*s-a*e)*_,t[6]=f*_,t[7]=(n*l-c*e)*_,t[8]=(o*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-i*c,i*l,-i*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Co.makeScale(t,e)),this}rotate(t){return this.premultiply(Co.makeRotation(-t)),this}translate(t,e){return this.premultiply(Co.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Co=new Wt;function Yh(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function pr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Fu(){const r=pr("canvas");return r.style.display="block",r}const lc={};function ao(r){r in lc||(lc[r]=!0,console.warn(r))}function Bu(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}function zu(r){const t=r.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Hu(r){const t=r.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const cc=new Wt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),hc=new Wt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),zs={[ze]:{transfer:ho,primaries:uo,luminanceCoefficients:[.2126,.7152,.0722],toReference:r=>r,fromReference:r=>r},[Be]:{transfer:ge,primaries:uo,luminanceCoefficients:[.2126,.7152,.0722],toReference:r=>r.convertSRGBToLinear(),fromReference:r=>r.convertLinearToSRGB()},[vo]:{transfer:ho,primaries:fo,luminanceCoefficients:[.2289,.6917,.0793],toReference:r=>r.applyMatrix3(hc),fromReference:r=>r.applyMatrix3(cc)},[El]:{transfer:ge,primaries:fo,luminanceCoefficients:[.2289,.6917,.0793],toReference:r=>r.convertSRGBToLinear().applyMatrix3(hc),fromReference:r=>r.applyMatrix3(cc).convertLinearToSRGB()}},Gu=new Set([ze,vo]),ee={enabled:!0,_workingColorSpace:ze,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(r){if(!Gu.has(r))throw new Error(`Unsupported working color space, "${r}".`);this._workingColorSpace=r},convert:function(r,t,e){if(this.enabled===!1||t===e||!t||!e)return r;const n=zs[t].toReference,i=zs[e].fromReference;return i(n(r))},fromWorkingColorSpace:function(r,t){return this.convert(r,this._workingColorSpace,t)},toWorkingColorSpace:function(r,t){return this.convert(r,t,this._workingColorSpace)},getPrimaries:function(r){return zs[r].primaries},getTransfer:function(r){return r===yi?ho:zs[r].transfer},getLuminanceCoefficients:function(r,t=this._workingColorSpace){return r.fromArray(zs[t].luminanceCoefficients)}};function _s(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Po(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let ji;class ku{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ji===void 0&&(ji=pr("canvas")),ji.width=t.width,ji.height=t.height;const n=ji.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=ji}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=pr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=_s(s[o]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(_s(e[n]/255)*255):e[n]=_s(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Vu=0;class qh{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Vu++}),this.uuid=In(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(Lo(i[o].image)):s.push(Lo(i[o]))}else s=Lo(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function Lo(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?ku.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Wu=0;class Ae extends Is{constructor(t=Ae.DEFAULT_IMAGE,e=Ae.DEFAULT_MAPPING,n=Si,i=Si,s=an,o=ai,a=fn,l=ci,c=Ae.DEFAULT_ANISOTROPY,h=yi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wu++}),this.uuid=In(),this.name="",this.source=new qh(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new jt(0,0),this.repeat=new jt(1,1),this.center=new jt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Wt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Ih)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ss:t.x=t.x-Math.floor(t.x);break;case Si:t.x=t.x<0?0:1;break;case co:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ss:t.y=t.y-Math.floor(t.y);break;case Si:t.y=t.y<0?0:1;break;case co:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ae.DEFAULT_IMAGE=null;Ae.DEFAULT_MAPPING=Ih;Ae.DEFAULT_ANISOTROPY=1;class se{constructor(t=0,e=0,n=0,i=1){se.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*i+o[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],m=l[9],_=l[2],p=l[6],g=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-_)<.01&&Math.abs(m-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+_)<.1&&Math.abs(m+p)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,y=(f+1)/2,A=(g+1)/2,w=(h+u)/4,E=(d+_)/4,L=(m+p)/4;return M>y&&M>A?M<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(M),i=w/n,s=E/n):y>A?y<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(y),n=w/i,s=L/i):A<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(A),n=E/s,i=L/s),this.set(n,i,s,e),this}let x=Math.sqrt((p-m)*(p-m)+(d-_)*(d-_)+(u-h)*(u-h));return Math.abs(x)<.001&&(x=1),this.x=(p-m)/x,this.y=(d-_)/x,this.z=(u-h)/x,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Xu extends Is{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new se(0,0,t,e),this.scissorTest=!1,this.viewport=new se(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Ae(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new qh(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Xi extends Xu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Kh extends Ae{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=je,this.minFilter=je,this.wrapR=Si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Yu extends Ae{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=je,this.minFilter=je,this.wrapR=Si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Dn{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,o,a){let l=n[i+0],c=n[i+1],h=n[i+2],d=n[i+3];const u=s[o+0],f=s[o+1],m=s[o+2],_=s[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(a===1){t[e+0]=u,t[e+1]=f,t[e+2]=m,t[e+3]=_;return}if(d!==_||l!==u||c!==f||h!==m){let p=1-a;const g=l*u+c*f+h*m+d*_,x=g>=0?1:-1,M=1-g*g;if(M>Number.EPSILON){const A=Math.sqrt(M),w=Math.atan2(A,g*x);p=Math.sin(p*w)/A,a=Math.sin(a*w)/A}const y=a*x;if(l=l*p+u*y,c=c*p+f*y,h=h*p+m*y,d=d*p+_*y,p===1-a){const A=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=A,c*=A,h*=A,d*=A}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,i,s,o){const a=n[i],l=n[i+1],c=n[i+2],h=n[i+3],d=s[o],u=s[o+1],f=s[o+2],m=s[o+3];return t[e]=a*m+h*d+l*f-c*u,t[e+1]=l*m+h*u+c*d-a*f,t[e+2]=c*m+h*f+a*u-l*d,t[e+3]=h*m-a*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(i/2),d=a(s/2),u=l(n/2),f=l(i/2),m=l(s/2);switch(o){case"XYZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"YXZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"ZXY":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"ZYX":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"YZX":this._x=u*h*d+c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d-u*f*m;break;case"XZY":this._x=u*h*d-c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d+u*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+a+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(s-c)*f,this._z=(o-i)*f}else if(n>a&&n>d){const f=2*Math.sqrt(1+n-a-d);this._w=(h-l)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(s+c)/f}else if(a>d){const f=2*Math.sqrt(1+a-n-d);this._w=(s-c)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+d-n-a);this._w=(o-i)/f,this._x=(s+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ve(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+i*c-s*l,this._y=i*h+o*l+s*a-n*c,this._z=s*h+o*c+n*l-i*a,this._w=o*h-n*a-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,s=this._z,o=this._w;let a=o*t._w+n*t._x+i*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*i+e*this._y,this._z=f*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,a),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=o*d+this._w*u,this._x=n*d+this._x*u,this._y=i*d+this._y*u,this._z=s*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class P{constructor(t=0,e=0,n=0){P.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(dc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(dc.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*i-a*n),h=2*(a*e-s*i),d=2*(s*n-o*e);return this.x=e+l*c+o*d-a*h,this.y=n+l*h+a*c-s*d,this.z=i+l*d+s*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=i*l-s*a,this.y=s*o-n*l,this.z=n*a-i*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Io.copy(this).projectOnVector(t),this.sub(Io)}reflect(t){return this.sub(Io.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ve(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Io=new P,dc=new Dn;class hi{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(_n.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(_n.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=_n.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,_n):_n.fromBufferAttribute(s,o),_n.applyMatrix4(t.matrixWorld),this.expandByPoint(_n);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Er.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Er.copy(n.boundingBox)),Er.applyMatrix4(t.matrixWorld),this.union(Er)}const i=t.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,_n),_n.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Hs),Tr.subVectors(this.max,Hs),$i.subVectors(t.a,Hs),Zi.subVectors(t.b,Hs),Ji.subVectors(t.c,Hs),ui.subVectors(Zi,$i),fi.subVectors(Ji,Zi),Ri.subVectors($i,Ji);let e=[0,-ui.z,ui.y,0,-fi.z,fi.y,0,-Ri.z,Ri.y,ui.z,0,-ui.x,fi.z,0,-fi.x,Ri.z,0,-Ri.x,-ui.y,ui.x,0,-fi.y,fi.x,0,-Ri.y,Ri.x,0];return!Do(e,$i,Zi,Ji,Tr)||(e=[1,0,0,0,1,0,0,0,1],!Do(e,$i,Zi,Ji,Tr))?!1:(Ar.crossVectors(ui,fi),e=[Ar.x,Ar.y,Ar.z],Do(e,$i,Zi,Ji,Tr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,_n).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(_n).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(jn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),jn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),jn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),jn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),jn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),jn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),jn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),jn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(jn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const jn=[new P,new P,new P,new P,new P,new P,new P,new P],_n=new P,Er=new hi,$i=new P,Zi=new P,Ji=new P,ui=new P,fi=new P,Ri=new P,Hs=new P,Tr=new P,Ar=new P,Ci=new P;function Do(r,t,e,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){Ci.fromArray(r,s);const a=i.x*Math.abs(Ci.x)+i.y*Math.abs(Ci.y)+i.z*Math.abs(Ci.z),l=t.dot(Ci),c=e.dot(Ci),h=n.dot(Ci);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}const qu=new hi,Gs=new P,No=new P;class Xn{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):qu.setFromPoints(t).getCenter(n);let i=0;for(let s=0,o=t.length;s<o;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Gs.subVectors(t,this.center);const e=Gs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(Gs,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(No.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Gs.copy(t.center).add(No)),this.expandByPoint(Gs.copy(t.center).sub(No))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const $n=new P,Oo=new P,wr=new P,pi=new P,Uo=new P,br=new P,Fo=new P;class yo{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,$n)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=$n.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):($n.copy(this.origin).addScaledVector(this.direction,e),$n.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Oo.copy(t).add(e).multiplyScalar(.5),wr.copy(e).sub(t).normalize(),pi.copy(this.origin).sub(Oo);const s=t.distanceTo(e)*.5,o=-this.direction.dot(wr),a=pi.dot(this.direction),l=-pi.dot(wr),c=pi.lengthSq(),h=Math.abs(1-o*o);let d,u,f,m;if(h>0)if(d=o*l-a,u=o*a-l,m=s*h,d>=0)if(u>=-m)if(u<=m){const _=1/h;d*=_,u*=_,f=d*(d+o*u+2*a)+u*(o*d+u+2*l)+c}else u=s,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;else u=-s,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;else u<=-m?(d=Math.max(0,-(-o*s+a)),u=d>0?-s:Math.min(Math.max(-s,-l),s),f=-d*d+u*(u+2*l)+c):u<=m?(d=0,u=Math.min(Math.max(-s,-l),s),f=u*(u+2*l)+c):(d=Math.max(0,-(o*s+a)),u=d>0?s:Math.min(Math.max(-s,-l),s),f=-d*d+u*(u+2*l)+c);else u=o>0?-s:s,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(Oo).addScaledVector(wr,u),f}intersectSphere(t,e){$n.subVectors(t.center,this.origin);const n=$n.dot(this.direction),i=$n.dot($n)-n*n,s=t.radius*t.radius;if(i>s)return null;const o=Math.sqrt(s-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,o,a,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,i=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,i=(t.min.x-u.x)*c),h>=0?(s=(t.min.y-u.y)*h,o=(t.max.y-u.y)*h):(s=(t.max.y-u.y)*h,o=(t.min.y-u.y)*h),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),d>=0?(a=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(a=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,$n)!==null}intersectTriangle(t,e,n,i,s){Uo.subVectors(e,t),br.subVectors(n,t),Fo.crossVectors(Uo,br);let o=this.direction.dot(Fo),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;pi.subVectors(this.origin,t);const l=a*this.direction.dot(br.crossVectors(pi,br));if(l<0)return null;const c=a*this.direction.dot(Uo.cross(pi));if(c<0||l+c>o)return null;const h=-a*pi.dot(Fo);return h<0?null:this.at(h/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Gt{constructor(t,e,n,i,s,o,a,l,c,h,d,u,f,m,_,p){Gt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c,h,d,u,f,m,_,p)}set(t,e,n,i,s,o,a,l,c,h,d,u,f,m,_,p){const g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=i,g[1]=s,g[5]=o,g[9]=a,g[13]=l,g[2]=c,g[6]=h,g[10]=d,g[14]=u,g[3]=f,g[7]=m,g[11]=_,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Gt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Qi.setFromMatrixColumn(t,0).length(),s=1/Qi.setFromMatrixColumn(t,1).length(),o=1/Qi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){const u=o*h,f=o*d,m=a*h,_=a*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+m*c,e[5]=u-_*c,e[9]=-a*l,e[2]=_-u*c,e[6]=m+f*c,e[10]=o*l}else if(t.order==="YXZ"){const u=l*h,f=l*d,m=c*h,_=c*d;e[0]=u+_*a,e[4]=m*a-f,e[8]=o*c,e[1]=o*d,e[5]=o*h,e[9]=-a,e[2]=f*a-m,e[6]=_+u*a,e[10]=o*l}else if(t.order==="ZXY"){const u=l*h,f=l*d,m=c*h,_=c*d;e[0]=u-_*a,e[4]=-o*d,e[8]=m+f*a,e[1]=f+m*a,e[5]=o*h,e[9]=_-u*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const u=o*h,f=o*d,m=a*h,_=a*d;e[0]=l*h,e[4]=m*c-f,e[8]=u*c+_,e[1]=l*d,e[5]=_*c+u,e[9]=f*c-m,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const u=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=_-u*d,e[8]=m*d+f,e[1]=d,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*d+m,e[10]=u-_*d}else if(t.order==="XZY"){const u=o*l,f=o*c,m=a*l,_=a*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+_,e[5]=o*h,e[9]=f*d-m,e[2]=m*d-f,e[6]=a*h,e[10]=_*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Ku,t,ju)}lookAt(t,e,n){const i=this.elements;return sn.subVectors(t,e),sn.lengthSq()===0&&(sn.z=1),sn.normalize(),mi.crossVectors(n,sn),mi.lengthSq()===0&&(Math.abs(n.z)===1?sn.x+=1e-4:sn.z+=1e-4,sn.normalize(),mi.crossVectors(n,sn)),mi.normalize(),Rr.crossVectors(sn,mi),i[0]=mi.x,i[4]=Rr.x,i[8]=sn.x,i[1]=mi.y,i[5]=Rr.y,i[9]=sn.y,i[2]=mi.z,i[6]=Rr.z,i[10]=sn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],m=n[2],_=n[6],p=n[10],g=n[14],x=n[3],M=n[7],y=n[11],A=n[15],w=i[0],E=i[4],L=i[8],U=i[12],v=i[1],S=i[5],I=i[9],D=i[13],F=i[2],q=i[6],O=i[10],z=i[14],G=i[3],et=i[7],K=i[11],j=i[15];return s[0]=o*w+a*v+l*F+c*G,s[4]=o*E+a*S+l*q+c*et,s[8]=o*L+a*I+l*O+c*K,s[12]=o*U+a*D+l*z+c*j,s[1]=h*w+d*v+u*F+f*G,s[5]=h*E+d*S+u*q+f*et,s[9]=h*L+d*I+u*O+f*K,s[13]=h*U+d*D+u*z+f*j,s[2]=m*w+_*v+p*F+g*G,s[6]=m*E+_*S+p*q+g*et,s[10]=m*L+_*I+p*O+g*K,s[14]=m*U+_*D+p*z+g*j,s[3]=x*w+M*v+y*F+A*G,s[7]=x*E+M*S+y*q+A*et,s[11]=x*L+M*I+y*O+A*K,s[15]=x*U+M*D+y*z+A*j,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],m=t[3],_=t[7],p=t[11],g=t[15];return m*(+s*l*d-i*c*d-s*a*u+n*c*u+i*a*f-n*l*f)+_*(+e*l*f-e*c*u+s*o*u-i*o*f+i*c*h-s*l*h)+p*(+e*c*d-e*a*f-s*o*d+n*o*f+s*a*h-n*c*h)+g*(-i*a*h-e*l*d+e*a*u+i*o*d-n*o*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],m=t[12],_=t[13],p=t[14],g=t[15],x=d*p*c-_*u*c+_*l*f-a*p*f-d*l*g+a*u*g,M=m*u*c-h*p*c-m*l*f+o*p*f+h*l*g-o*u*g,y=h*_*c-m*d*c+m*a*f-o*_*f-h*a*g+o*d*g,A=m*d*l-h*_*l-m*a*u+o*_*u+h*a*p-o*d*p,w=e*x+n*M+i*y+s*A;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const E=1/w;return t[0]=x*E,t[1]=(_*u*s-d*p*s-_*i*f+n*p*f+d*i*g-n*u*g)*E,t[2]=(a*p*s-_*l*s+_*i*c-n*p*c-a*i*g+n*l*g)*E,t[3]=(d*l*s-a*u*s-d*i*c+n*u*c+a*i*f-n*l*f)*E,t[4]=M*E,t[5]=(h*p*s-m*u*s+m*i*f-e*p*f-h*i*g+e*u*g)*E,t[6]=(m*l*s-o*p*s-m*i*c+e*p*c+o*i*g-e*l*g)*E,t[7]=(o*u*s-h*l*s+h*i*c-e*u*c-o*i*f+e*l*f)*E,t[8]=y*E,t[9]=(m*d*s-h*_*s-m*n*f+e*_*f+h*n*g-e*d*g)*E,t[10]=(o*_*s-m*a*s+m*n*c-e*_*c-o*n*g+e*a*g)*E,t[11]=(h*a*s-o*d*s-h*n*c+e*d*c+o*n*f-e*a*f)*E,t[12]=A*E,t[13]=(h*_*i-m*d*i+m*n*u-e*_*u-h*n*p+e*d*p)*E,t[14]=(m*a*i-o*_*i-m*n*l+e*_*l+o*n*p-e*a*p)*E,t[15]=(o*d*i-h*a*i+h*n*l-e*d*l-o*n*u+e*a*u)*E,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,o=t.x,a=t.y,l=t.z,c=s*o,h=s*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,h*a+n,h*l-i*o,0,c*l-i*a,h*l+i*o,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,o){return this.set(1,n,s,0,t,1,o,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,c=s+s,h=o+o,d=a+a,u=s*c,f=s*h,m=s*d,_=o*h,p=o*d,g=a*d,x=l*c,M=l*h,y=l*d,A=n.x,w=n.y,E=n.z;return i[0]=(1-(_+g))*A,i[1]=(f+y)*A,i[2]=(m-M)*A,i[3]=0,i[4]=(f-y)*w,i[5]=(1-(u+g))*w,i[6]=(p+x)*w,i[7]=0,i[8]=(m+M)*E,i[9]=(p-x)*E,i[10]=(1-(u+_))*E,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let s=Qi.set(i[0],i[1],i[2]).length();const o=Qi.set(i[4],i[5],i[6]).length(),a=Qi.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),t.x=i[12],t.y=i[13],t.z=i[14],xn.copy(this);const c=1/s,h=1/o,d=1/a;return xn.elements[0]*=c,xn.elements[1]*=c,xn.elements[2]*=c,xn.elements[4]*=h,xn.elements[5]*=h,xn.elements[6]*=h,xn.elements[8]*=d,xn.elements[9]*=d,xn.elements[10]*=d,e.setFromRotationMatrix(xn),n.x=s,n.y=o,n.z=a,this}makePerspective(t,e,n,i,s,o,a=li){const l=this.elements,c=2*s/(e-t),h=2*s/(n-i),d=(e+t)/(e-t),u=(n+i)/(n-i);let f,m;if(a===li)f=-(o+s)/(o-s),m=-2*o*s/(o-s);else if(a===po)f=-o/(o-s),m=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,o,a=li){const l=this.elements,c=1/(e-t),h=1/(n-i),d=1/(o-s),u=(e+t)*c,f=(n+i)*h;let m,_;if(a===li)m=(o+s)*d,_=-2*d;else if(a===po)m=s*d,_=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=_,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Qi=new P,xn=new Gt,Ku=new P(0,0,0),ju=new P(1,1,1),mi=new P,Rr=new P,sn=new P,uc=new Gt,fc=new Dn;class Nn{constructor(t=0,e=0,n=0,i=Nn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],o=i[4],a=i[8],l=i[1],c=i[5],h=i[9],d=i[2],u=i[6],f=i[10];switch(e){case"XYZ":this._y=Math.asin(Ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ve(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ve(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Ve(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Ve(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return uc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(uc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return fc.setFromEuler(this),this.setFromQuaternion(fc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Nn.DEFAULT_ORDER="XYZ";class jh{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let $u=0;const pc=new P,ts=new Dn,Zn=new Gt,Cr=new P,ks=new P,Zu=new P,Ju=new Dn,mc=new P(1,0,0),gc=new P(0,1,0),_c=new P(0,0,1),xc={type:"added"},Qu={type:"removed"},es={type:"childadded",child:null},Bo={type:"childremoved",child:null};class he extends Is{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:$u++}),this.uuid=In(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=he.DEFAULT_UP.clone();const t=new P,e=new Nn,n=new Dn,i=new P(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Gt},normalMatrix:{value:new Wt}}),this.matrix=new Gt,this.matrixWorld=new Gt,this.matrixAutoUpdate=he.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=he.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new jh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ts.setFromAxisAngle(t,e),this.quaternion.multiply(ts),this}rotateOnWorldAxis(t,e){return ts.setFromAxisAngle(t,e),this.quaternion.premultiply(ts),this}rotateX(t){return this.rotateOnAxis(mc,t)}rotateY(t){return this.rotateOnAxis(gc,t)}rotateZ(t){return this.rotateOnAxis(_c,t)}translateOnAxis(t,e){return pc.copy(t).applyQuaternion(this.quaternion),this.position.add(pc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(mc,t)}translateY(t){return this.translateOnAxis(gc,t)}translateZ(t){return this.translateOnAxis(_c,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Zn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Cr.copy(t):Cr.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zn.lookAt(ks,Cr,this.up):Zn.lookAt(Cr,ks,this.up),this.quaternion.setFromRotationMatrix(Zn),i&&(Zn.extractRotation(i.matrixWorld),ts.setFromRotationMatrix(Zn),this.quaternion.premultiply(ts.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(xc),es.child=t,this.dispatchEvent(es),es.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Qu),Bo.child=t,this.dispatchEvent(Bo),Bo.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Zn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Zn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Zn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(xc),es.child=t,this.dispatchEvent(es),es.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,t,Zu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,Ju,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];s(t.shapes,d)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(t.materials,this.material[l]));i.material=a}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];i.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),d=o(t.shapes),u=o(t.skeletons),f=o(t.animations),m=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(a){const l=[];for(const c in a){const h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}he.DEFAULT_UP=new P(0,1,0);he.DEFAULT_MATRIX_AUTO_UPDATE=!0;he.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Mn=new P,Jn=new P,zo=new P,Qn=new P,ns=new P,is=new P,Mc=new P,Ho=new P,Go=new P,ko=new P,Vo=new se,Wo=new se,Xo=new se;class Pn{constructor(t=new P,e=new P,n=new P){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Mn.subVectors(t,e),i.cross(Mn);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){Mn.subVectors(i,e),Jn.subVectors(n,e),zo.subVectors(t,e);const o=Mn.dot(Mn),a=Mn.dot(Jn),l=Mn.dot(zo),c=Jn.dot(Jn),h=Jn.dot(zo),d=o*c-a*a;if(d===0)return s.set(0,0,0),null;const u=1/d,f=(c*l-a*h)*u,m=(o*h-a*l)*u;return s.set(1-f-m,m,f)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Qn)===null?!1:Qn.x>=0&&Qn.y>=0&&Qn.x+Qn.y<=1}static getInterpolation(t,e,n,i,s,o,a,l){return this.getBarycoord(t,e,n,i,Qn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Qn.x),l.addScaledVector(o,Qn.y),l.addScaledVector(a,Qn.z),l)}static getInterpolatedAttribute(t,e,n,i,s,o){return Vo.setScalar(0),Wo.setScalar(0),Xo.setScalar(0),Vo.fromBufferAttribute(t,e),Wo.fromBufferAttribute(t,n),Xo.fromBufferAttribute(t,i),o.setScalar(0),o.addScaledVector(Vo,s.x),o.addScaledVector(Wo,s.y),o.addScaledVector(Xo,s.z),o}static isFrontFacing(t,e,n,i){return Mn.subVectors(n,e),Jn.subVectors(t,e),Mn.cross(Jn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Mn.subVectors(this.c,this.b),Jn.subVectors(this.a,this.b),Mn.cross(Jn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Pn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Pn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return Pn.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return Pn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Pn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let o,a;ns.subVectors(i,n),is.subVectors(s,n),Ho.subVectors(t,n);const l=ns.dot(Ho),c=is.dot(Ho);if(l<=0&&c<=0)return e.copy(n);Go.subVectors(t,i);const h=ns.dot(Go),d=is.dot(Go);if(h>=0&&d<=h)return e.copy(i);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(ns,o);ko.subVectors(t,s);const f=ns.dot(ko),m=is.dot(ko);if(m>=0&&f<=m)return e.copy(s);const _=f*c-l*m;if(_<=0&&c>=0&&m<=0)return a=c/(c-m),e.copy(n).addScaledVector(is,a);const p=h*m-f*d;if(p<=0&&d-h>=0&&f-m>=0)return Mc.subVectors(s,i),a=(d-h)/(d-h+(f-m)),e.copy(i).addScaledVector(Mc,a);const g=1/(p+_+u);return o=_*g,a=u*g,e.copy(n).addScaledVector(ns,o).addScaledVector(is,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const $h={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},Pr={h:0,s:0,l:0};function Yo(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class Lt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Be){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ee.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=ee.workingColorSpace){return this.r=t,this.g=e,this.b=n,ee.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=ee.workingColorSpace){if(t=Tl(t,1),e=Ve(e,0,1),n=Ve(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=Yo(o,s,t+1/3),this.g=Yo(o,s,t),this.b=Yo(o,s,t-1/3)}return ee.toWorkingColorSpace(this,i),this}setStyle(t,e=Be){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Be){const n=$h[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=_s(t.r),this.g=_s(t.g),this.b=_s(t.b),this}copyLinearToSRGB(t){return this.r=Po(t.r),this.g=Po(t.g),this.b=Po(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Be){return ee.fromWorkingColorSpace(ke.copy(this),t),Math.round(Ve(ke.r*255,0,255))*65536+Math.round(Ve(ke.g*255,0,255))*256+Math.round(Ve(ke.b*255,0,255))}getHexString(t=Be){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ee.workingColorSpace){ee.fromWorkingColorSpace(ke.copy(this),e);const n=ke.r,i=ke.g,s=ke.b,o=Math.max(n,i,s),a=Math.min(n,i,s);let l,c;const h=(a+o)/2;if(a===o)l=0,c=0;else{const d=o-a;switch(c=h<=.5?d/(o+a):d/(2-o-a),o){case n:l=(i-s)/d+(i<s?6:0);break;case i:l=(s-n)/d+2;break;case s:l=(n-i)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ee.workingColorSpace){return ee.fromWorkingColorSpace(ke.copy(this),e),t.r=ke.r,t.g=ke.g,t.b=ke.b,t}getStyle(t=Be){ee.fromWorkingColorSpace(ke.copy(this),t);const e=ke.r,n=ke.g,i=ke.b;return t!==Be?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(gi),this.setHSL(gi.h+t,gi.s+e,gi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(gi),t.getHSL(Pr);const n=ar(gi.h,Pr.h,e),i=ar(gi.s,Pr.s,e),s=ar(gi.l,Pr.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ke=new Lt;Lt.NAMES=$h;let tf=0;class kn extends Is{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:tf++}),this.uuid=In(),this.name="",this.type="Material",this.blending=ms,this.side=Vn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ma,this.blendDst=va,this.blendEquation=Gi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Lt(0,0,0),this.blendAlpha=0,this.depthFunc=Ms,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=rc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ki,this.stencilZFail=Ki,this.stencilZPass=Ki,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ms&&(n.blending=this.blending),this.side!==Vn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ma&&(n.blendSrc=this.blendSrc),this.blendDst!==va&&(n.blendDst=this.blendDst),this.blendEquation!==Gi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ms&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==rc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ki&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ki&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ki&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=i(t.textures),o=i(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class ln extends kn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Lt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=Lh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Se=new P,Lr=new jt;class Te{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=il,this.updateRanges=[],this.gpuType=Ln,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Lr.fromBufferAttribute(this,e),Lr.applyMatrix3(t),this.setXY(e,Lr.x,Lr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix3(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix4(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyNormalMatrix(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.transformDirection(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Cn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=le(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Cn(e,this.array)),e}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Cn(e,this.array)),e}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Cn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Cn(e,this.array)),e}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array),s=le(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==il&&(t.usage=this.usage),t}}class Zh extends Te{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Jh extends Te{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class De extends Te{constructor(t,e,n){super(new Float32Array(t),e,n)}}let ef=0;const hn=new Gt,qo=new he,ss=new P,rn=new hi,Vs=new hi,Ce=new P;class Ye extends Is{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ef++}),this.uuid=In(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Yh(t)?Jh:Zh)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Wt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return hn.makeRotationFromQuaternion(t),this.applyMatrix4(hn),this}rotateX(t){return hn.makeRotationX(t),this.applyMatrix4(hn),this}rotateY(t){return hn.makeRotationY(t),this.applyMatrix4(hn),this}rotateZ(t){return hn.makeRotationZ(t),this.applyMatrix4(hn),this}translate(t,e,n){return hn.makeTranslation(t,e,n),this.applyMatrix4(hn),this}scale(t,e,n){return hn.makeScale(t,e,n),this.applyMatrix4(hn),this}lookAt(t){return qo.lookAt(t),qo.updateMatrix(),this.applyMatrix4(qo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ss).negate(),this.translate(ss.x,ss.y,ss.z),this}setFromPoints(t){const e=[];for(let n=0,i=t.length;n<i;n++){const s=t[n];e.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new De(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new hi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];rn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ce.addVectors(this.boundingBox.min,rn.min),this.boundingBox.expandByPoint(Ce),Ce.addVectors(this.boundingBox.max,rn.max),this.boundingBox.expandByPoint(Ce)):(this.boundingBox.expandByPoint(rn.min),this.boundingBox.expandByPoint(rn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Xn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){const n=this.boundingSphere.center;if(rn.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Vs.setFromBufferAttribute(a),this.morphTargetsRelative?(Ce.addVectors(rn.min,Vs.min),rn.expandByPoint(Ce),Ce.addVectors(rn.max,Vs.max),rn.expandByPoint(Ce)):(rn.expandByPoint(Vs.min),rn.expandByPoint(Vs.max))}rn.getCenter(n);let i=0;for(let s=0,o=t.count;s<o;s++)Ce.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Ce));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Ce.fromBufferAttribute(a,c),l&&(ss.fromBufferAttribute(t,c),Ce.add(ss)),i=Math.max(i,n.distanceToSquared(Ce))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Te(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let L=0;L<n.count;L++)a[L]=new P,l[L]=new P;const c=new P,h=new P,d=new P,u=new jt,f=new jt,m=new jt,_=new P,p=new P;function g(L,U,v){c.fromBufferAttribute(n,L),h.fromBufferAttribute(n,U),d.fromBufferAttribute(n,v),u.fromBufferAttribute(s,L),f.fromBufferAttribute(s,U),m.fromBufferAttribute(s,v),h.sub(c),d.sub(c),f.sub(u),m.sub(u);const S=1/(f.x*m.y-m.x*f.y);isFinite(S)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(d,-f.y).multiplyScalar(S),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(S),a[L].add(_),a[U].add(_),a[v].add(_),l[L].add(p),l[U].add(p),l[v].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let L=0,U=x.length;L<U;++L){const v=x[L],S=v.start,I=v.count;for(let D=S,F=S+I;D<F;D+=3)g(t.getX(D+0),t.getX(D+1),t.getX(D+2))}const M=new P,y=new P,A=new P,w=new P;function E(L){A.fromBufferAttribute(i,L),w.copy(A);const U=a[L];M.copy(U),M.sub(A.multiplyScalar(A.dot(U))).normalize(),y.crossVectors(w,U);const S=y.dot(l[L])<0?-1:1;o.setXYZW(L,M.x,M.y,M.z,S)}for(let L=0,U=x.length;L<U;++L){const v=x[L],S=v.start,I=v.count;for(let D=S,F=S+I;D<F;D+=3)E(t.getX(D+0)),E(t.getX(D+1)),E(t.getX(D+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Te(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const i=new P,s=new P,o=new P,a=new P,l=new P,c=new P,h=new P,d=new P;if(t)for(let u=0,f=t.count;u<f;u+=3){const m=t.getX(u+0),_=t.getX(u+1),p=t.getX(u+2);i.fromBufferAttribute(e,m),s.fromBufferAttribute(e,_),o.fromBufferAttribute(e,p),h.subVectors(o,s),d.subVectors(i,s),h.cross(d),a.fromBufferAttribute(n,m),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,p),a.add(h),l.add(h),c.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)i.fromBufferAttribute(e,u+0),s.fromBufferAttribute(e,u+1),o.fromBufferAttribute(e,u+2),h.subVectors(o,s),d.subVectors(i,s),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ce.fromBufferAttribute(t,e),Ce.normalize(),t.setXYZ(e,Ce.x,Ce.y,Ce.z)}toNonIndexed(){function t(a,l){const c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h);let f=0,m=0;for(let _=0,p=l.length;_<p;_++){a.isInterleavedBufferAttribute?f=l[_]*a.data.stride+a.offset:f=l[_]*h;for(let g=0;g<h;g++)u[m++]=c[f++]}return new Te(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Ye,n=this.index.array,i=this.attributes;for(const a in i){const l=i[a],c=t(l,n);e.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let h=0,d=c.length;h<d;h++){const u=c[h],f=t(u,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(i[l]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const s=t.morphAttributes;for(const c in s){const h=[],d=s[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,h=o.length;c<h;c++){const d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const vc=new Gt,Pi=new yo,Ir=new Xn,yc=new P,Dr=new P,Nr=new P,Or=new P,Ko=new P,Ur=new P,Sc=new P,Fr=new P;class ht extends he{constructor(t=new Ye,e=new ln){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const a=this.morphTargetInfluences;if(s&&a){Ur.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=a[l],d=s[l];h!==0&&(Ko.fromBufferAttribute(d,t),o?Ur.addScaledVector(Ko,h):Ur.addScaledVector(Ko.sub(e),h))}e.add(Ur)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ir.copy(n.boundingSphere),Ir.applyMatrix4(s),Pi.copy(t.ray).recast(t.near),!(Ir.containsPoint(Pi.origin)===!1&&(Pi.intersectSphere(Ir,yc)===null||Pi.origin.distanceToSquared(yc)>(t.far-t.near)**2))&&(vc.copy(s).invert(),Pi.copy(t.ray).applyMatrix4(vc),!(n.boundingBox!==null&&Pi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Pi)))}_computeIntersections(t,e,n){let i;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,u=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const p=u[m],g=o[p.materialIndex],x=Math.max(p.start,f.start),M=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let y=x,A=M;y<A;y+=3){const w=a.getX(y),E=a.getX(y+1),L=a.getX(y+2);i=Br(this,g,t,n,c,h,d,w,E,L),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){const x=a.getX(p),M=a.getX(p+1),y=a.getX(p+2);i=Br(this,o,t,n,c,h,d,x,M,y),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const p=u[m],g=o[p.materialIndex],x=Math.max(p.start,f.start),M=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let y=x,A=M;y<A;y+=3){const w=y,E=y+1,L=y+2;i=Br(this,g,t,n,c,h,d,w,E,L),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){const x=p,M=p+1,y=p+2;i=Br(this,o,t,n,c,h,d,x,M,y),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}}}function nf(r,t,e,n,i,s,o,a){let l;if(t.side===tn?l=n.intersectTriangle(o,s,i,!0,a):l=n.intersectTriangle(i,s,o,t.side===Vn,a),l===null)return null;Fr.copy(a),Fr.applyMatrix4(r.matrixWorld);const c=e.ray.origin.distanceTo(Fr);return c<e.near||c>e.far?null:{distance:c,point:Fr.clone(),object:r}}function Br(r,t,e,n,i,s,o,a,l,c){r.getVertexPosition(a,Dr),r.getVertexPosition(l,Nr),r.getVertexPosition(c,Or);const h=nf(r,t,e,n,Dr,Nr,Or,Sc);if(h){const d=new P;Pn.getBarycoord(Sc,Dr,Nr,Or,d),i&&(h.uv=Pn.getInterpolatedAttribute(i,a,l,c,d,new jt)),s&&(h.uv1=Pn.getInterpolatedAttribute(s,a,l,c,d,new jt)),o&&(h.normal=Pn.getInterpolatedAttribute(o,a,l,c,d,new P),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a,b:l,c,normal:new P,materialIndex:0};Pn.getNormal(Dr,Nr,Or,u.normal),h.face=u,h.barycoord=d}return h}class Pt extends Ye{constructor(t=1,e=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};const a=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],h=[],d=[];let u=0,f=0;m("z","y","x",-1,-1,n,e,t,o,s,0),m("z","y","x",1,-1,n,e,-t,o,s,1),m("x","z","y",1,1,t,n,e,i,o,2),m("x","z","y",1,-1,t,n,-e,i,o,3),m("x","y","z",1,-1,t,e,n,i,s,4),m("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new De(c,3)),this.setAttribute("normal",new De(h,3)),this.setAttribute("uv",new De(d,2));function m(_,p,g,x,M,y,A,w,E,L,U){const v=y/E,S=A/L,I=y/2,D=A/2,F=w/2,q=E+1,O=L+1;let z=0,G=0;const et=new P;for(let K=0;K<O;K++){const j=K*S-D;for(let pt=0;pt<q;pt++){const It=pt*v-I;et[_]=It*x,et[p]=j*M,et[g]=F,c.push(et.x,et.y,et.z),et[_]=0,et[p]=0,et[g]=w>0?1:-1,h.push(et.x,et.y,et.z),d.push(pt/E),d.push(1-K/L),z+=1}}for(let K=0;K<L;K++)for(let j=0;j<E;j++){const pt=u+j+q*K,It=u+j+q*(K+1),X=u+(j+1)+q*(K+1),$=u+(j+1)+q*K;l.push(pt,It,$),l.push(It,X,$),G+=6}a.addGroup(f,G,U),f+=G,u+=z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Pt(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ws(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function Ke(r){const t={};for(let e=0;e<r.length;e++){const n=ws(r[e]);for(const i in n)t[i]=n[i]}return t}function sf(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function Qh(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ee.workingColorSpace}const rf={clone:ws,merge:Ke};var of=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,af=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class wi extends kn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=of,this.fragmentShader=af,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ws(t.uniforms),this.uniformsGroups=sf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?e.uniforms[i]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[i]={type:"m4",value:o.toArray()}:e.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class td extends he{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Gt,this.projectionMatrix=new Gt,this.projectionMatrixInverse=new Gt,this.coordinateSystem=li}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const _i=new P,Ec=new jt,Tc=new jt;class We extends td{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=As*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(or*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return As*2*Math.atan(Math.tan(or*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){_i.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(_i.x,_i.y).multiplyScalar(-t/_i.z),_i.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(_i.x,_i.y).multiplyScalar(-t/_i.z)}getViewSize(t,e){return this.getViewBounds(t,Ec,Tc),e.subVectors(Tc,Ec)}setViewOffset(t,e,n,i,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(or*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*i/l,e-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const rs=-90,os=1;class lf extends he{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new We(rs,os,t,e);i.layers=this.layers,this.add(i);const s=new We(rs,os,t,e);s.layers=this.layers,this.add(s);const o=new We(rs,os,t,e);o.layers=this.layers,this.add(o);const a=new We(rs,os,t,e);a.layers=this.layers,this.add(a);const l=new We(rs,os,t,e);l.layers=this.layers,this.add(l);const c=new We(rs,os,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,o,a,l]=e;for(const c of e)this.remove(c);if(t===li)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===po)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,s),t.setRenderTarget(n,1,i),t.render(e,o),t.setRenderTarget(n,2,i),t.render(e,a),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class ed extends Ae{constructor(t,e,n,i,s,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:vs,super(t,e,n,i,s,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class cf extends Xi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new ed(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:an}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Pt(5,5,5),s=new wi({name:"CubemapFromEquirect",uniforms:ws(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:tn,blending:Ti});s.uniforms.tEquirect.value=e;const o=new ht(i,s),a=e.minFilter;return e.minFilter===ai&&(e.minFilter=an),new lf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,i){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,i);t.setRenderTarget(s)}}const jo=new P,hf=new P,df=new Wt;class Ui{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=jo.subVectors(n,e).cross(hf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(jo),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||df.getNormalMatrix(t),i=this.coplanarPoint(jo).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Li=new Xn,zr=new P;class Al{constructor(t=new Ui,e=new Ui,n=new Ui,i=new Ui,s=new Ui,o=new Ui){this.planes=[t,e,n,i,s,o]}set(t,e,n,i,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(i),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=li){const n=this.planes,i=t.elements,s=i[0],o=i[1],a=i[2],l=i[3],c=i[4],h=i[5],d=i[6],u=i[7],f=i[8],m=i[9],_=i[10],p=i[11],g=i[12],x=i[13],M=i[14],y=i[15];if(n[0].setComponents(l-s,u-c,p-f,y-g).normalize(),n[1].setComponents(l+s,u+c,p+f,y+g).normalize(),n[2].setComponents(l+o,u+h,p+m,y+x).normalize(),n[3].setComponents(l-o,u-h,p-m,y-x).normalize(),n[4].setComponents(l-a,u-d,p-_,y-M).normalize(),e===li)n[5].setComponents(l+a,u+d,p+_,y+M).normalize();else if(e===po)n[5].setComponents(a,d,_,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Li.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Li.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Li)}intersectsSprite(t){return Li.center.set(0,0,0),Li.radius=.7071067811865476,Li.applyMatrix4(t.matrixWorld),this.intersectsSphere(Li)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(zr.x=i.normal.x>0?t.max.x:t.min.x,zr.y=i.normal.y>0?t.max.y:t.min.y,zr.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(zr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function nd(){let r=null,t=!1,e=null,n=null;function i(s,o){e(s,o),n=r.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function uf(r){const t=new WeakMap;function e(a,l){const c=a.array,h=a.usage,d=c.byteLength,u=r.createBuffer();r.bindBuffer(l,u),r.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=r.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=r.SHORT;else if(c instanceof Uint32Array)f=r.UNSIGNED_INT;else if(c instanceof Int32Array)f=r.INT;else if(c instanceof Int8Array)f=r.BYTE;else if(c instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,l,c){const h=l.array,d=l.updateRanges;if(r.bindBuffer(c,a),d.length===0)r.bufferSubData(c,0,h);else{d.sort((f,m)=>f.start-m.start);let u=0;for(let f=1;f<d.length;f++){const m=d[u],_=d[f];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++u,d[u]=_)}d.length=u+1;for(let f=0,m=d.length;f<m;f++){const _=d[f];r.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(r.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:i,remove:s,update:o}}class Ds extends Ye{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,o=e/2,a=Math.floor(n),l=Math.floor(i),c=a+1,h=l+1,d=t/a,u=e/l,f=[],m=[],_=[],p=[];for(let g=0;g<h;g++){const x=g*u-o;for(let M=0;M<c;M++){const y=M*d-s;m.push(y,-x,0),_.push(0,0,1),p.push(M/a),p.push(1-g/l)}}for(let g=0;g<l;g++)for(let x=0;x<a;x++){const M=x+c*g,y=x+c*(g+1),A=x+1+c*(g+1),w=x+1+c*g;f.push(M,y,w),f.push(y,A,w)}this.setIndex(f),this.setAttribute("position",new De(m,3)),this.setAttribute("normal",new De(_,3)),this.setAttribute("uv",new De(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ds(t.width,t.height,t.widthSegments,t.heightSegments)}}var ff=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,mf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,gf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_f=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,xf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Mf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,vf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,yf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Sf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ef=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Tf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Af=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,wf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Rf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Cf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Lf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,If=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Df=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Nf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Of=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Uf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ff=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Bf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,zf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Hf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,kf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Vf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Yf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,qf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Kf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,jf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,$f=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Zf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Jf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,tp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ep=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,np=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ip=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,sp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,rp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,op=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ap=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,dp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,up=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,fp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,pp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mp=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gp=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_p=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xp=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Mp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,yp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Sp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ep=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Tp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ap=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,wp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,bp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Rp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Cp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Lp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ip=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Dp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Np=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Op=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Up=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Fp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Bp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,zp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Hp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Gp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,kp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Vp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Wp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Xp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Yp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,qp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Kp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,jp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,$p=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Zp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Jp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Qp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,t0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,e0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,n0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,i0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,s0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,r0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,o0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,a0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,l0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,c0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,h0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,d0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const u0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,f0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,p0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,m0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,g0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,x0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,M0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,v0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,y0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,S0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,E0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,T0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,A0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,w0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,b0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,R0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,C0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,P0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,L0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,I0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,D0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,N0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,O0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,U0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,F0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,B0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,z0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,H0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,G0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,k0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,V0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,W0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,X0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Vt={alphahash_fragment:ff,alphahash_pars_fragment:pf,alphamap_fragment:mf,alphamap_pars_fragment:gf,alphatest_fragment:_f,alphatest_pars_fragment:xf,aomap_fragment:Mf,aomap_pars_fragment:vf,batching_pars_vertex:yf,batching_vertex:Sf,begin_vertex:Ef,beginnormal_vertex:Tf,bsdfs:Af,iridescence_fragment:wf,bumpmap_pars_fragment:bf,clipping_planes_fragment:Rf,clipping_planes_pars_fragment:Cf,clipping_planes_pars_vertex:Pf,clipping_planes_vertex:Lf,color_fragment:If,color_pars_fragment:Df,color_pars_vertex:Nf,color_vertex:Of,common:Uf,cube_uv_reflection_fragment:Ff,defaultnormal_vertex:Bf,displacementmap_pars_vertex:zf,displacementmap_vertex:Hf,emissivemap_fragment:Gf,emissivemap_pars_fragment:kf,colorspace_fragment:Vf,colorspace_pars_fragment:Wf,envmap_fragment:Xf,envmap_common_pars_fragment:Yf,envmap_pars_fragment:qf,envmap_pars_vertex:Kf,envmap_physical_pars_fragment:rp,envmap_vertex:jf,fog_vertex:$f,fog_pars_vertex:Zf,fog_fragment:Jf,fog_pars_fragment:Qf,gradientmap_pars_fragment:tp,lightmap_pars_fragment:ep,lights_lambert_fragment:np,lights_lambert_pars_fragment:ip,lights_pars_begin:sp,lights_toon_fragment:op,lights_toon_pars_fragment:ap,lights_phong_fragment:lp,lights_phong_pars_fragment:cp,lights_physical_fragment:hp,lights_physical_pars_fragment:dp,lights_fragment_begin:up,lights_fragment_maps:fp,lights_fragment_end:pp,logdepthbuf_fragment:mp,logdepthbuf_pars_fragment:gp,logdepthbuf_pars_vertex:_p,logdepthbuf_vertex:xp,map_fragment:Mp,map_pars_fragment:vp,map_particle_fragment:yp,map_particle_pars_fragment:Sp,metalnessmap_fragment:Ep,metalnessmap_pars_fragment:Tp,morphinstance_vertex:Ap,morphcolor_vertex:wp,morphnormal_vertex:bp,morphtarget_pars_vertex:Rp,morphtarget_vertex:Cp,normal_fragment_begin:Pp,normal_fragment_maps:Lp,normal_pars_fragment:Ip,normal_pars_vertex:Dp,normal_vertex:Np,normalmap_pars_fragment:Op,clearcoat_normal_fragment_begin:Up,clearcoat_normal_fragment_maps:Fp,clearcoat_pars_fragment:Bp,iridescence_pars_fragment:zp,opaque_fragment:Hp,packing:Gp,premultiplied_alpha_fragment:kp,project_vertex:Vp,dithering_fragment:Wp,dithering_pars_fragment:Xp,roughnessmap_fragment:Yp,roughnessmap_pars_fragment:qp,shadowmap_pars_fragment:Kp,shadowmap_pars_vertex:jp,shadowmap_vertex:$p,shadowmask_pars_fragment:Zp,skinbase_vertex:Jp,skinning_pars_vertex:Qp,skinning_vertex:t0,skinnormal_vertex:e0,specularmap_fragment:n0,specularmap_pars_fragment:i0,tonemapping_fragment:s0,tonemapping_pars_fragment:r0,transmission_fragment:o0,transmission_pars_fragment:a0,uv_pars_fragment:l0,uv_pars_vertex:c0,uv_vertex:h0,worldpos_vertex:d0,background_vert:u0,background_frag:f0,backgroundCube_vert:p0,backgroundCube_frag:m0,cube_vert:g0,cube_frag:_0,depth_vert:x0,depth_frag:M0,distanceRGBA_vert:v0,distanceRGBA_frag:y0,equirect_vert:S0,equirect_frag:E0,linedashed_vert:T0,linedashed_frag:A0,meshbasic_vert:w0,meshbasic_frag:b0,meshlambert_vert:R0,meshlambert_frag:C0,meshmatcap_vert:P0,meshmatcap_frag:L0,meshnormal_vert:I0,meshnormal_frag:D0,meshphong_vert:N0,meshphong_frag:O0,meshphysical_vert:U0,meshphysical_frag:F0,meshtoon_vert:B0,meshtoon_frag:z0,points_vert:H0,points_frag:G0,shadow_vert:k0,shadow_frag:V0,sprite_vert:W0,sprite_frag:X0},ut={common:{diffuse:{value:new Lt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Wt}},envmap:{envMap:{value:null},envMapRotation:{value:new Wt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Wt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Wt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Wt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Wt},normalScale:{value:new jt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Wt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Wt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Wt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Wt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Lt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Lt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0},uvTransform:{value:new Wt}},sprite:{diffuse:{value:new Lt(16777215)},opacity:{value:1},center:{value:new jt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}}},zn={basic:{uniforms:Ke([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Vt.meshbasic_vert,fragmentShader:Vt.meshbasic_frag},lambert:{uniforms:Ke([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Lt(0)}}]),vertexShader:Vt.meshlambert_vert,fragmentShader:Vt.meshlambert_frag},phong:{uniforms:Ke([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Lt(0)},specular:{value:new Lt(1118481)},shininess:{value:30}}]),vertexShader:Vt.meshphong_vert,fragmentShader:Vt.meshphong_frag},standard:{uniforms:Ke([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new Lt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag},toon:{uniforms:Ke([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new Lt(0)}}]),vertexShader:Vt.meshtoon_vert,fragmentShader:Vt.meshtoon_frag},matcap:{uniforms:Ke([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Vt.meshmatcap_vert,fragmentShader:Vt.meshmatcap_frag},points:{uniforms:Ke([ut.points,ut.fog]),vertexShader:Vt.points_vert,fragmentShader:Vt.points_frag},dashed:{uniforms:Ke([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Vt.linedashed_vert,fragmentShader:Vt.linedashed_frag},depth:{uniforms:Ke([ut.common,ut.displacementmap]),vertexShader:Vt.depth_vert,fragmentShader:Vt.depth_frag},normal:{uniforms:Ke([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Vt.meshnormal_vert,fragmentShader:Vt.meshnormal_frag},sprite:{uniforms:Ke([ut.sprite,ut.fog]),vertexShader:Vt.sprite_vert,fragmentShader:Vt.sprite_frag},background:{uniforms:{uvTransform:{value:new Wt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Vt.background_vert,fragmentShader:Vt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Wt}},vertexShader:Vt.backgroundCube_vert,fragmentShader:Vt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Vt.cube_vert,fragmentShader:Vt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Vt.equirect_vert,fragmentShader:Vt.equirect_frag},distanceRGBA:{uniforms:Ke([ut.common,ut.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Vt.distanceRGBA_vert,fragmentShader:Vt.distanceRGBA_frag},shadow:{uniforms:Ke([ut.lights,ut.fog,{color:{value:new Lt(0)},opacity:{value:1}}]),vertexShader:Vt.shadow_vert,fragmentShader:Vt.shadow_frag}};zn.physical={uniforms:Ke([zn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Wt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Wt},clearcoatNormalScale:{value:new jt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Wt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Wt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Wt},sheen:{value:0},sheenColor:{value:new Lt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Wt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Wt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Wt},transmissionSamplerSize:{value:new jt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Wt},attenuationDistance:{value:0},attenuationColor:{value:new Lt(0)},specularColor:{value:new Lt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Wt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Wt},anisotropyVector:{value:new jt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Wt}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag};const Hr={r:0,b:0,g:0},Ii=new Nn,Y0=new Gt;function q0(r,t,e,n,i,s,o){const a=new Lt(0);let l=s===!0?0:1,c,h,d=null,u=0,f=null;function m(x){let M=x.isScene===!0?x.background:null;return M&&M.isTexture&&(M=(x.backgroundBlurriness>0?e:t).get(M)),M}function _(x){let M=!1;const y=m(x);y===null?g(a,l):y&&y.isColor&&(g(y,1),M=!0);const A=r.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(r.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function p(x,M){const y=m(M);y&&(y.isCubeTexture||y.mapping===Mo)?(h===void 0&&(h=new ht(new Pt(1,1,1),new wi({name:"BackgroundCubeMaterial",uniforms:ws(zn.backgroundCube.uniforms),vertexShader:zn.backgroundCube.vertexShader,fragmentShader:zn.backgroundCube.fragmentShader,side:tn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(A,w,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Ii.copy(M.backgroundRotation),Ii.x*=-1,Ii.y*=-1,Ii.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Ii.y*=-1,Ii.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Y0.makeRotationFromEuler(Ii)),h.material.toneMapped=ee.getTransfer(y.colorSpace)!==ge,(d!==y||u!==y.version||f!==r.toneMapping)&&(h.material.needsUpdate=!0,d=y,u=y.version,f=r.toneMapping),h.layers.enableAll(),x.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new ht(new Ds(2,2),new wi({name:"BackgroundMaterial",uniforms:ws(zn.background.uniforms),vertexShader:zn.background.vertexShader,fragmentShader:zn.background.fragmentShader,side:Vn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ee.getTransfer(y.colorSpace)!==ge,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(d!==y||u!==y.version||f!==r.toneMapping)&&(c.material.needsUpdate=!0,d=y,u=y.version,f=r.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function g(x,M){x.getRGB(Hr,Qh(r)),n.buffers.color.setClear(Hr.r,Hr.g,Hr.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(x,M=1){a.set(x),l=M,g(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(x){l=x,g(a,l)},render:_,addToRenderList:p}}function K0(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=u(null);let s=i,o=!1;function a(v,S,I,D,F){let q=!1;const O=d(D,I,S);s!==O&&(s=O,c(s.object)),q=f(v,D,I,F),q&&m(v,D,I,F),F!==null&&t.update(F,r.ELEMENT_ARRAY_BUFFER),(q||o)&&(o=!1,y(v,S,I,D),F!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function l(){return r.createVertexArray()}function c(v){return r.bindVertexArray(v)}function h(v){return r.deleteVertexArray(v)}function d(v,S,I){const D=I.wireframe===!0;let F=n[v.id];F===void 0&&(F={},n[v.id]=F);let q=F[S.id];q===void 0&&(q={},F[S.id]=q);let O=q[D];return O===void 0&&(O=u(l()),q[D]=O),O}function u(v){const S=[],I=[],D=[];for(let F=0;F<e;F++)S[F]=0,I[F]=0,D[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:I,attributeDivisors:D,object:v,attributes:{},index:null}}function f(v,S,I,D){const F=s.attributes,q=S.attributes;let O=0;const z=I.getAttributes();for(const G in z)if(z[G].location>=0){const K=F[G];let j=q[G];if(j===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(j=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(j=v.instanceColor)),K===void 0||K.attribute!==j||j&&K.data!==j.data)return!0;O++}return s.attributesNum!==O||s.index!==D}function m(v,S,I,D){const F={},q=S.attributes;let O=0;const z=I.getAttributes();for(const G in z)if(z[G].location>=0){let K=q[G];K===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(K=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(K=v.instanceColor));const j={};j.attribute=K,K&&K.data&&(j.data=K.data),F[G]=j,O++}s.attributes=F,s.attributesNum=O,s.index=D}function _(){const v=s.newAttributes;for(let S=0,I=v.length;S<I;S++)v[S]=0}function p(v){g(v,0)}function g(v,S){const I=s.newAttributes,D=s.enabledAttributes,F=s.attributeDivisors;I[v]=1,D[v]===0&&(r.enableVertexAttribArray(v),D[v]=1),F[v]!==S&&(r.vertexAttribDivisor(v,S),F[v]=S)}function x(){const v=s.newAttributes,S=s.enabledAttributes;for(let I=0,D=S.length;I<D;I++)S[I]!==v[I]&&(r.disableVertexAttribArray(I),S[I]=0)}function M(v,S,I,D,F,q,O){O===!0?r.vertexAttribIPointer(v,S,I,F,q):r.vertexAttribPointer(v,S,I,D,F,q)}function y(v,S,I,D){_();const F=D.attributes,q=I.getAttributes(),O=S.defaultAttributeValues;for(const z in q){const G=q[z];if(G.location>=0){let et=F[z];if(et===void 0&&(z==="instanceMatrix"&&v.instanceMatrix&&(et=v.instanceMatrix),z==="instanceColor"&&v.instanceColor&&(et=v.instanceColor)),et!==void 0){const K=et.normalized,j=et.itemSize,pt=t.get(et);if(pt===void 0)continue;const It=pt.buffer,X=pt.type,$=pt.bytesPerElement,rt=X===r.INT||X===r.UNSIGNED_INT||et.gpuType===gl;if(et.isInterleavedBufferAttribute){const J=et.data,st=J.stride,lt=et.offset;if(J.isInstancedInterleavedBuffer){for(let ot=0;ot<G.locationSize;ot++)g(G.location+ot,J.meshPerAttribute);v.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let ot=0;ot<G.locationSize;ot++)p(G.location+ot);r.bindBuffer(r.ARRAY_BUFFER,It);for(let ot=0;ot<G.locationSize;ot++)M(G.location+ot,j/G.locationSize,X,K,st*$,(lt+j/G.locationSize*ot)*$,rt)}else{if(et.isInstancedBufferAttribute){for(let J=0;J<G.locationSize;J++)g(G.location+J,et.meshPerAttribute);v.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=et.meshPerAttribute*et.count)}else for(let J=0;J<G.locationSize;J++)p(G.location+J);r.bindBuffer(r.ARRAY_BUFFER,It);for(let J=0;J<G.locationSize;J++)M(G.location+J,j/G.locationSize,X,K,j*$,j/G.locationSize*J*$,rt)}}else if(O!==void 0){const K=O[z];if(K!==void 0)switch(K.length){case 2:r.vertexAttrib2fv(G.location,K);break;case 3:r.vertexAttrib3fv(G.location,K);break;case 4:r.vertexAttrib4fv(G.location,K);break;default:r.vertexAttrib1fv(G.location,K)}}}}x()}function A(){L();for(const v in n){const S=n[v];for(const I in S){const D=S[I];for(const F in D)h(D[F].object),delete D[F];delete S[I]}delete n[v]}}function w(v){if(n[v.id]===void 0)return;const S=n[v.id];for(const I in S){const D=S[I];for(const F in D)h(D[F].object),delete D[F];delete S[I]}delete n[v.id]}function E(v){for(const S in n){const I=n[S];if(I[v.id]===void 0)continue;const D=I[v.id];for(const F in D)h(D[F].object),delete D[F];delete I[v.id]}}function L(){U(),o=!0,s!==i&&(s=i,c(s.object))}function U(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:L,resetDefaultState:U,dispose:A,releaseStatesOfGeometry:w,releaseStatesOfProgram:E,initAttributes:_,enableAttribute:p,disableUnusedAttributes:x}}function j0(r,t,e){let n;function i(c){n=c}function s(c,h){r.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,d){d!==0&&(r.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function a(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let f=0;for(let m=0;m<d;m++)f+=h[m];e.update(f,n,1)}function l(c,h,d,u){if(d===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<c.length;m++)o(c[m],h[m],u[m]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let m=0;for(let _=0;_<d;_++)m+=h[_];for(let _=0;_<u.length;_++)e.update(m,n,u[_])}}this.setMode=i,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function $0(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const E=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(E){return!(E!==fn&&n.convert(E)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(E){const L=E===xr&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(E!==ci&&n.convert(E)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==Ln&&!L)}function l(E){if(E==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(u===!0){const E=t.get("EXT_clip_control");E.clipControlEXT(E.LOWER_LEFT_EXT,E.ZERO_TO_ONE_EXT)}const f=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),m=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=r.getParameter(r.MAX_TEXTURE_SIZE),p=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),g=r.getParameter(r.MAX_VERTEX_ATTRIBS),x=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),M=r.getParameter(r.MAX_VARYING_VECTORS),y=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),A=m>0,w=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:f,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:x,maxVaryings:M,maxFragmentUniforms:y,vertexTextures:A,maxSamples:w}}function Z0(r){const t=this;let e=null,n=0,i=!1,s=!1;const o=new Ui,a=new Wt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||i;return i=u,n=d.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){const m=d.clippingPlanes,_=d.clipIntersection,p=d.clipShadows,g=r.get(d);if(!i||m===null||m.length===0||s&&!p)s?h(null):c();else{const x=s?0:n,M=x*4;let y=g.clippingState||null;l.value=y,y=h(m,u,M,f);for(let A=0;A!==M;++A)y[A]=e[A];g.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,f,m){const _=d!==null?d.length:0;let p=null;if(_!==0){if(p=l.value,m!==!0||p===null){const g=f+_*4,x=u.matrixWorldInverse;a.getNormalMatrix(x),(p===null||p.length<g)&&(p=new Float32Array(g));for(let M=0,y=f;M!==_;++M,y+=4)o.copy(d[M]).applyMatrix4(x,a),o.normal.toArray(p,y),p[y+3]=o.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,p}}function J0(r){let t=new WeakMap;function e(o,a){return a===Ra?o.mapping=vs:a===Ca&&(o.mapping=ys),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Ra||a===Ca)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new cf(l.height);return c.fromEquirectangularTexture(r,o),t.set(o,c),o.addEventListener("dispose",i),e(c.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class wl extends td{constructor(t=-1,e=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const fs=4,Ac=[.125,.215,.35,.446,.526,.582],ki=20,$o=new wl,wc=new Lt;let Zo=null,Jo=0,Qo=0,ta=!1;const Fi=(1+Math.sqrt(5))/2,as=1/Fi,bc=[new P(-Fi,as,0),new P(Fi,as,0),new P(-as,0,Fi),new P(as,0,Fi),new P(0,Fi,-as),new P(0,Fi,as),new P(-1,1,-1),new P(1,1,-1),new P(-1,1,1),new P(1,1,1)];class Rc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){Zo=this._renderer.getRenderTarget(),Jo=this._renderer.getActiveCubeFace(),Qo=this._renderer.getActiveMipmapLevel(),ta=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,i,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Lc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Pc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Zo,Jo,Qo),this._renderer.xr.enabled=ta,t.scissorTest=!1,Gr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===vs||t.mapping===ys?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Zo=this._renderer.getRenderTarget(),Jo=this._renderer.getActiveCubeFace(),Qo=this._renderer.getActiveMipmapLevel(),ta=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:an,minFilter:an,generateMipmaps:!1,type:xr,format:fn,colorSpace:ze,depthBuffer:!1},i=Cc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cc(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Q0(s)),this._blurMaterial=tm(s,t,e)}return i}_compileMaterial(t){const e=new ht(this._lodPlanes[0],t);this._renderer.compile(e,$o)}_sceneToCubeUV(t,e,n,i){const a=new We(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(wc),h.toneMapping=Ai,h.autoClear=!1;const f=new ln({name:"PMREM.Background",side:tn,depthWrite:!1,depthTest:!1}),m=new ht(new Pt,f);let _=!1;const p=t.background;p?p.isColor&&(f.color.copy(p),t.background=null,_=!0):(f.color.copy(wc),_=!0);for(let g=0;g<6;g++){const x=g%3;x===0?(a.up.set(0,l[g],0),a.lookAt(c[g],0,0)):x===1?(a.up.set(0,0,l[g]),a.lookAt(0,c[g],0)):(a.up.set(0,l[g],0),a.lookAt(0,0,c[g]));const M=this._cubeSize;Gr(i,x*M,g>2?M:0,M,M),h.setRenderTarget(i),_&&h.render(m,a),h.render(t,a)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===vs||t.mapping===ys;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Lc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Pc());const s=i?this._cubemapMaterial:this._equirectMaterial,o=new ht(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;Gr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,$o)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=bc[(i-s-1)%bc.length];this._blur(t,s-1,s,o,a)}e.autoClear=n}_blur(t,e,n,i,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,i,"latitudinal",s),this._halfBlur(o,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new ht(this._lodPlanes[i],c),u=c.uniforms,f=this._sizeLods[n]-1,m=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*ki-1),_=s/m,p=isFinite(s)?1+Math.floor(h*_):ki;p>ki&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ki}`);const g=[];let x=0;for(let E=0;E<ki;++E){const L=E/_,U=Math.exp(-L*L/2);g.push(U),E===0?x+=U:E<p&&(x+=2*U)}for(let E=0;E<g.length;E++)g[E]=g[E]/x;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=g,u.latitudinal.value=o==="latitudinal",a&&(u.poleAxis.value=a);const{_lodMax:M}=this;u.dTheta.value=m,u.mipInt.value=M-n;const y=this._sizeLods[i],A=3*y*(i>M-fs?i-M+fs:0),w=4*(this._cubeSize-y);Gr(e,A,w,3*y,2*y),l.setRenderTarget(e),l.render(d,$o)}}function Q0(r){const t=[],e=[],n=[];let i=r;const s=r-fs+1+Ac.length;for(let o=0;o<s;o++){const a=Math.pow(2,i);e.push(a);let l=1/a;o>r-fs?l=Ac[o-r+fs-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,m=6,_=3,p=2,g=1,x=new Float32Array(_*m*f),M=new Float32Array(p*m*f),y=new Float32Array(g*m*f);for(let w=0;w<f;w++){const E=w%3*2/3-1,L=w>2?0:-1,U=[E,L,0,E+2/3,L,0,E+2/3,L+1,0,E,L,0,E+2/3,L+1,0,E,L+1,0];x.set(U,_*m*w),M.set(u,p*m*w);const v=[w,w,w,w,w,w];y.set(v,g*m*w)}const A=new Ye;A.setAttribute("position",new Te(x,_)),A.setAttribute("uv",new Te(M,p)),A.setAttribute("faceIndex",new Te(y,g)),t.push(A),i>fs&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Cc(r,t,e){const n=new Xi(r,t,e);return n.texture.mapping=Mo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Gr(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function tm(r,t,e){const n=new Float32Array(ki),i=new P(0,1,0);return new wi({name:"SphericalGaussianBlur",defines:{n:ki,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:bl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function Pc(){return new wi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:bl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function Lc(){return new wi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:bl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function bl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function em(r){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Ra||l===Ca,h=l===vs||l===ys;if(c||h){let d=t.get(a);const u=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==u)return e===null&&(e=new Rc(r)),d=c?e.fromEquirectangular(a,d):e.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),d.texture;if(d!==void 0)return d.texture;{const f=a.image;return c&&f&&f.height>0||h&&f&&i(f)?(e===null&&(e=new Rc(r)),d=c?e.fromEquirectangular(a):e.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),a.addEventListener("dispose",s),d.texture):null}}}return a}function i(a){let l=0;const c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function nm(r){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&ao("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function im(r,t,e,n){const i={},s=new WeakMap;function o(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const m in u.attributes)t.remove(u.attributes[m]);for(const m in u.morphAttributes){const _=u.morphAttributes[m];for(let p=0,g=_.length;p<g;p++)t.remove(_[p])}u.removeEventListener("dispose",o),delete i[u.id];const f=s.get(u);f&&(t.remove(f),s.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function a(d,u){return i[u.id]===!0||(u.addEventListener("dispose",o),i[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const m in u)t.update(u[m],r.ARRAY_BUFFER);const f=d.morphAttributes;for(const m in f){const _=f[m];for(let p=0,g=_.length;p<g;p++)t.update(_[p],r.ARRAY_BUFFER)}}function c(d){const u=[],f=d.index,m=d.attributes.position;let _=0;if(f!==null){const x=f.array;_=f.version;for(let M=0,y=x.length;M<y;M+=3){const A=x[M+0],w=x[M+1],E=x[M+2];u.push(A,w,w,E,E,A)}}else if(m!==void 0){const x=m.array;_=m.version;for(let M=0,y=x.length/3-1;M<y;M+=3){const A=M+0,w=M+1,E=M+2;u.push(A,w,w,E,E,A)}}else return;const p=new(Yh(u)?Jh:Zh)(u,1);p.version=_;const g=s.get(d);g&&t.remove(g),s.set(d,p)}function h(d){const u=s.get(d);if(u){const f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return s.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function sm(r,t,e){let n;function i(u){n=u}let s,o;function a(u){s=u.type,o=u.bytesPerElement}function l(u,f){r.drawElements(n,f,s,u*o),e.update(f,n,1)}function c(u,f,m){m!==0&&(r.drawElementsInstanced(n,f,s,u*o,m),e.update(f,n,m))}function h(u,f,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,u,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];e.update(p,n,1)}function d(u,f,m,_){if(m===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<u.length;g++)c(u[g]/o,f[g],_[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,s,u,0,_,0,m);let g=0;for(let x=0;x<m;x++)g+=f[x];for(let x=0;x<_.length;x++)e.update(g,n,_[x])}}this.setMode=i,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function rm(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case r.TRIANGLES:e.triangles+=a*(s/3);break;case r.LINES:e.lines+=a*(s/2);break;case r.LINE_STRIP:e.lines+=a*(s-1);break;case r.LINE_LOOP:e.lines+=a*s;break;case r.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function om(r,t,e){const n=new WeakMap,i=new se;function s(o,a,l){const c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(a);if(u===void 0||u.count!==d){let v=function(){L.dispose(),n.delete(a),a.removeEventListener("dispose",v)};var f=v;u!==void 0&&u.texture.dispose();const m=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,p=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],x=a.morphAttributes.normal||[],M=a.morphAttributes.color||[];let y=0;m===!0&&(y=1),_===!0&&(y=2),p===!0&&(y=3);let A=a.attributes.position.count*y,w=1;A>t.maxTextureSize&&(w=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);const E=new Float32Array(A*w*4*d),L=new Kh(E,A,w,d);L.type=Ln,L.needsUpdate=!0;const U=y*4;for(let S=0;S<d;S++){const I=g[S],D=x[S],F=M[S],q=A*w*4*S;for(let O=0;O<I.count;O++){const z=O*U;m===!0&&(i.fromBufferAttribute(I,O),E[q+z+0]=i.x,E[q+z+1]=i.y,E[q+z+2]=i.z,E[q+z+3]=0),_===!0&&(i.fromBufferAttribute(D,O),E[q+z+4]=i.x,E[q+z+5]=i.y,E[q+z+6]=i.z,E[q+z+7]=0),p===!0&&(i.fromBufferAttribute(F,O),E[q+z+8]=i.x,E[q+z+9]=i.y,E[q+z+10]=i.z,E[q+z+11]=F.itemSize===4?i.w:1)}}u={count:d,texture:L,size:new jt(A,w)},n.set(a,u),a.addEventListener("dispose",v)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",o.morphTexture,e);else{let m=0;for(let p=0;p<c.length;p++)m+=c[p];const _=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(r,"morphTargetBaseInfluence",_),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(r,"morphTargetsTextureSize",u.size)}return{update:s}}function am(r,t,e,n){let i=new WeakMap;function s(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(i.get(d)!==c&&(t.update(d),i.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),i.get(l)!==c&&(e.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,r.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;i.get(u)!==c&&(u.update(),i.set(u,c))}return d}function o(){i=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:o}}class id extends Ae{constructor(t,e,n,i,s,o,a,l,c,h=gs){if(h!==gs&&h!==Ts)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===gs&&(n=Wi),n===void 0&&h===Ts&&(n=Es),super(null,i,s,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:je,this.minFilter=l!==void 0?l:je,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const sd=new Ae,Ic=new id(1,1),rd=new Kh,od=new Yu,ad=new ed,Dc=[],Nc=[],Oc=new Float32Array(16),Uc=new Float32Array(9),Fc=new Float32Array(4);function Ns(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=Dc[i];if(s===void 0&&(s=new Float32Array(i),Dc[i]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,r[o].toArray(s,a)}return s}function be(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function Re(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function So(r,t){let e=Nc[t];e===void 0&&(e=new Int32Array(t),Nc[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function lm(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function cm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;r.uniform2fv(this.addr,t),Re(e,t)}}function hm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(be(e,t))return;r.uniform3fv(this.addr,t),Re(e,t)}}function dm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;r.uniform4fv(this.addr,t),Re(e,t)}}function um(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),Re(e,t)}else{if(be(e,n))return;Fc.set(n),r.uniformMatrix2fv(this.addr,!1,Fc),Re(e,n)}}function fm(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),Re(e,t)}else{if(be(e,n))return;Uc.set(n),r.uniformMatrix3fv(this.addr,!1,Uc),Re(e,n)}}function pm(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),Re(e,t)}else{if(be(e,n))return;Oc.set(n),r.uniformMatrix4fv(this.addr,!1,Oc),Re(e,n)}}function mm(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function gm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;r.uniform2iv(this.addr,t),Re(e,t)}}function _m(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(be(e,t))return;r.uniform3iv(this.addr,t),Re(e,t)}}function xm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;r.uniform4iv(this.addr,t),Re(e,t)}}function Mm(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function vm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;r.uniform2uiv(this.addr,t),Re(e,t)}}function ym(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(be(e,t))return;r.uniform3uiv(this.addr,t),Re(e,t)}}function Sm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;r.uniform4uiv(this.addr,t),Re(e,t)}}function Em(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(Ic.compareFunction=Xh,s=Ic):s=sd,e.setTexture2D(t||s,i)}function Tm(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||od,i)}function Am(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||ad,i)}function wm(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||rd,i)}function bm(r){switch(r){case 5126:return lm;case 35664:return cm;case 35665:return hm;case 35666:return dm;case 35674:return um;case 35675:return fm;case 35676:return pm;case 5124:case 35670:return mm;case 35667:case 35671:return gm;case 35668:case 35672:return _m;case 35669:case 35673:return xm;case 5125:return Mm;case 36294:return vm;case 36295:return ym;case 36296:return Sm;case 35678:case 36198:case 36298:case 36306:case 35682:return Em;case 35679:case 36299:case 36307:return Tm;case 35680:case 36300:case 36308:case 36293:return Am;case 36289:case 36303:case 36311:case 36292:return wm}}function Rm(r,t){r.uniform1fv(this.addr,t)}function Cm(r,t){const e=Ns(t,this.size,2);r.uniform2fv(this.addr,e)}function Pm(r,t){const e=Ns(t,this.size,3);r.uniform3fv(this.addr,e)}function Lm(r,t){const e=Ns(t,this.size,4);r.uniform4fv(this.addr,e)}function Im(r,t){const e=Ns(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function Dm(r,t){const e=Ns(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function Nm(r,t){const e=Ns(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function Om(r,t){r.uniform1iv(this.addr,t)}function Um(r,t){r.uniform2iv(this.addr,t)}function Fm(r,t){r.uniform3iv(this.addr,t)}function Bm(r,t){r.uniform4iv(this.addr,t)}function zm(r,t){r.uniform1uiv(this.addr,t)}function Hm(r,t){r.uniform2uiv(this.addr,t)}function Gm(r,t){r.uniform3uiv(this.addr,t)}function km(r,t){r.uniform4uiv(this.addr,t)}function Vm(r,t,e){const n=this.cache,i=t.length,s=So(e,i);be(n,s)||(r.uniform1iv(this.addr,s),Re(n,s));for(let o=0;o!==i;++o)e.setTexture2D(t[o]||sd,s[o])}function Wm(r,t,e){const n=this.cache,i=t.length,s=So(e,i);be(n,s)||(r.uniform1iv(this.addr,s),Re(n,s));for(let o=0;o!==i;++o)e.setTexture3D(t[o]||od,s[o])}function Xm(r,t,e){const n=this.cache,i=t.length,s=So(e,i);be(n,s)||(r.uniform1iv(this.addr,s),Re(n,s));for(let o=0;o!==i;++o)e.setTextureCube(t[o]||ad,s[o])}function Ym(r,t,e){const n=this.cache,i=t.length,s=So(e,i);be(n,s)||(r.uniform1iv(this.addr,s),Re(n,s));for(let o=0;o!==i;++o)e.setTexture2DArray(t[o]||rd,s[o])}function qm(r){switch(r){case 5126:return Rm;case 35664:return Cm;case 35665:return Pm;case 35666:return Lm;case 35674:return Im;case 35675:return Dm;case 35676:return Nm;case 5124:case 35670:return Om;case 35667:case 35671:return Um;case 35668:case 35672:return Fm;case 35669:case 35673:return Bm;case 5125:return zm;case 36294:return Hm;case 36295:return Gm;case 36296:return km;case 35678:case 36198:case 36298:case 36306:case 35682:return Vm;case 35679:case 36299:case 36307:return Wm;case 35680:case 36300:case 36308:case 36293:return Xm;case 36289:case 36303:case 36311:case 36292:return Ym}}class Km{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=bm(e.type)}}class jm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=qm(e.type)}}class $m{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,o=i.length;s!==o;++s){const a=i[s];a.setValue(t,e[a.id],n)}}}const ea=/(\w+)(\])?(\[|\.)?/g;function Bc(r,t){r.seq.push(t),r.map[t.id]=t}function Zm(r,t,e){const n=r.name,i=n.length;for(ea.lastIndex=0;;){const s=ea.exec(n),o=ea.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){Bc(e,c===void 0?new Km(a,r,t):new jm(a,r,t));break}else{let d=e.map[a];d===void 0&&(d=new $m(a),Bc(e,d)),e=d}}}class lo{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=t.getActiveUniform(e,i),o=t.getUniformLocation(e,s.name);Zm(s,o,this)}}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const o=t[i];o.id in e&&n.push(o)}return n}}function zc(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const Jm=37297;let Qm=0;function tg(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=i;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}function eg(r){const t=ee.getPrimaries(ee.workingColorSpace),e=ee.getPrimaries(r);let n;switch(t===e?n="":t===fo&&e===uo?n="LinearDisplayP3ToLinearSRGB":t===uo&&e===fo&&(n="LinearSRGBToLinearDisplayP3"),r){case ze:case vo:return[n,"LinearTransferOETF"];case Be:case El:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",r),[n,"LinearTransferOETF"]}}function Hc(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),i=r.getShaderInfoLog(t).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+i+`

`+tg(r.getShaderSource(t),o)}else return i}function ng(r,t){const e=eg(t);return`vec4 ${r}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function ig(r,t){let e;switch(t){case eu:e="Linear";break;case nu:e="Reinhard";break;case iu:e="Cineon";break;case su:e="ACESFilmic";break;case ou:e="AgX";break;case au:e="Neutral";break;case ru:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const kr=new P;function sg(){ee.getLuminanceCoefficients(kr);const r=kr.x.toFixed(4),t=kr.y.toFixed(4),e=kr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function rg(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(nr).join(`
`)}function og(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function ag(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),o=s.name;let a=1;s.type===r.FLOAT_MAT2&&(a=2),s.type===r.FLOAT_MAT3&&(a=3),s.type===r.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:r.getAttribLocation(t,o),locationSize:a}}return e}function nr(r){return r!==""}function Gc(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function kc(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const lg=/^[ \t]*#include +<([\w\d./]+)>/gm;function sl(r){return r.replace(lg,hg)}const cg=new Map;function hg(r,t){let e=Vt[t];if(e===void 0){const n=cg.get(t);if(n!==void 0)e=Vt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return sl(e)}const dg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vc(r){return r.replace(dg,ug)}function ug(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function Wc(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function fg(r){let t="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Ch?t="SHADOWMAP_TYPE_PCF":r.shadowMapType===Ph?t="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===si&&(t="SHADOWMAP_TYPE_VSM"),t}function pg(r){let t="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case vs:case ys:t="ENVMAP_TYPE_CUBE";break;case Mo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function mg(r){let t="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case ys:t="ENVMAP_MODE_REFRACTION";break}return t}function gg(r){let t="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case Lh:t="ENVMAP_BLENDING_MULTIPLY";break;case Qd:t="ENVMAP_BLENDING_MIX";break;case tu:t="ENVMAP_BLENDING_ADD";break}return t}function _g(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function xg(r,t,e,n){const i=r.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=fg(e),c=pg(e),h=mg(e),d=gg(e),u=_g(e),f=rg(e),m=og(s),_=i.createProgram();let p,g,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(nr).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(nr).join(`
`),g.length>0&&(g+=`
`)):(p=[Wc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(nr).join(`
`),g=[Wc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ai?"#define TONE_MAPPING":"",e.toneMapping!==Ai?Vt.tonemapping_pars_fragment:"",e.toneMapping!==Ai?ig("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Vt.colorspace_pars_fragment,ng("linearToOutputTexel",e.outputColorSpace),sg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(nr).join(`
`)),o=sl(o),o=Gc(o,e),o=kc(o,e),a=sl(a),a=Gc(a,e),a=kc(a,e),o=Vc(o),a=Vc(a),e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",e.glslVersion===oc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===oc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const M=x+p+o,y=x+g+a,A=zc(i,i.VERTEX_SHADER,M),w=zc(i,i.FRAGMENT_SHADER,y);i.attachShader(_,A),i.attachShader(_,w),e.index0AttributeName!==void 0?i.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function E(S){if(r.debug.checkShaderErrors){const I=i.getProgramInfoLog(_).trim(),D=i.getShaderInfoLog(A).trim(),F=i.getShaderInfoLog(w).trim();let q=!0,O=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(q=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,_,A,w);else{const z=Hc(i,A,"vertex"),G=Hc(i,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+S.name+`
Material Type: `+S.type+`

Program Info Log: `+I+`
`+z+`
`+G)}else I!==""?console.warn("THREE.WebGLProgram: Program Info Log:",I):(D===""||F==="")&&(O=!1);O&&(S.diagnostics={runnable:q,programLog:I,vertexShader:{log:D,prefix:p},fragmentShader:{log:F,prefix:g}})}i.deleteShader(A),i.deleteShader(w),L=new lo(i,_),U=ag(i,_)}let L;this.getUniforms=function(){return L===void 0&&E(this),L};let U;this.getAttributes=function(){return U===void 0&&E(this),U};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=i.getProgramParameter(_,Jm)),v},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Qm++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=A,this.fragmentShader=w,this}let Mg=0;class vg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new yg(t),e.set(t,n)),n}}class yg{constructor(t){this.id=Mg++,this.code=t,this.usedTimes=0}}function Sg(r,t,e,n,i,s,o){const a=new jh,l=new vg,c=new Set,h=[],d=i.logarithmicDepthBuffer,u=i.reverseDepthBuffer,f=i.vertexTextures;let m=i.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(v){return c.add(v),v===0?"uv":`uv${v}`}function g(v,S,I,D,F){const q=D.fog,O=F.geometry,z=v.isMeshStandardMaterial?D.environment:null,G=(v.isMeshStandardMaterial?e:t).get(v.envMap||z),et=G&&G.mapping===Mo?G.image.height:null,K=_[v.type];v.precision!==null&&(m=i.getMaxPrecision(v.precision),m!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",m,"instead."));const j=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,pt=j!==void 0?j.length:0;let It=0;O.morphAttributes.position!==void 0&&(It=1),O.morphAttributes.normal!==void 0&&(It=2),O.morphAttributes.color!==void 0&&(It=3);let X,$,rt,J;if(K){const Ze=zn[K];X=Ze.vertexShader,$=Ze.fragmentShader}else X=v.vertexShader,$=v.fragmentShader,l.update(v),rt=l.getVertexShaderID(v),J=l.getFragmentShaderID(v);const st=r.getRenderTarget(),lt=F.isInstancedMesh===!0,ot=F.isBatchedMesh===!0,wt=!!v.map,Ct=!!v.matcap,N=!!G,Ee=!!v.aoMap,Xt=!!v.lightMap,Yt=!!v.bumpMap,Dt=!!v.normalMap,ue=!!v.displacementMap,Ot=!!v.emissiveMap,C=!!v.metalnessMap,T=!!v.roughnessMap,V=v.anisotropy>0,Q=v.clearcoat>0,it=v.dispersion>0,tt=v.iridescence>0,Tt=v.sheen>0,ft=v.transmission>0,vt=V&&!!v.anisotropyMap,Qt=Q&&!!v.clearcoatMap,at=Q&&!!v.clearcoatNormalMap,yt=Q&&!!v.clearcoatRoughnessMap,Bt=tt&&!!v.iridescenceMap,zt=tt&&!!v.iridescenceThicknessMap,St=Tt&&!!v.sheenColorMap,Zt=Tt&&!!v.sheenRoughnessMap,Ht=!!v.specularMap,fe=!!v.specularColorMap,B=!!v.specularIntensityMap,xt=ft&&!!v.transmissionMap,Z=ft&&!!v.thicknessMap,nt=!!v.gradientMap,mt=!!v.alphaMap,Mt=v.alphaTest>0,Jt=!!v.alphaHash,ye=!!v.extensions;let $e=Ai;v.toneMapped&&(st===null||st.isXRRenderTarget===!0)&&($e=r.toneMapping);const ne={shaderID:K,shaderType:v.type,shaderName:v.name,vertexShader:X,fragmentShader:$,defines:v.defines,customVertexShaderID:rt,customFragmentShaderID:J,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:m,batching:ot,batchingColor:ot&&F._colorsTexture!==null,instancing:lt,instancingColor:lt&&F.instanceColor!==null,instancingMorph:lt&&F.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:st===null?r.outputColorSpace:st.isXRRenderTarget===!0?st.texture.colorSpace:ze,alphaToCoverage:!!v.alphaToCoverage,map:wt,matcap:Ct,envMap:N,envMapMode:N&&G.mapping,envMapCubeUVHeight:et,aoMap:Ee,lightMap:Xt,bumpMap:Yt,normalMap:Dt,displacementMap:f&&ue,emissiveMap:Ot,normalMapObjectSpace:Dt&&v.normalMapType===fu,normalMapTangentSpace:Dt&&v.normalMapType===Wh,metalnessMap:C,roughnessMap:T,anisotropy:V,anisotropyMap:vt,clearcoat:Q,clearcoatMap:Qt,clearcoatNormalMap:at,clearcoatRoughnessMap:yt,dispersion:it,iridescence:tt,iridescenceMap:Bt,iridescenceThicknessMap:zt,sheen:Tt,sheenColorMap:St,sheenRoughnessMap:Zt,specularMap:Ht,specularColorMap:fe,specularIntensityMap:B,transmission:ft,transmissionMap:xt,thicknessMap:Z,gradientMap:nt,opaque:v.transparent===!1&&v.blending===ms&&v.alphaToCoverage===!1,alphaMap:mt,alphaTest:Mt,alphaHash:Jt,combine:v.combine,mapUv:wt&&p(v.map.channel),aoMapUv:Ee&&p(v.aoMap.channel),lightMapUv:Xt&&p(v.lightMap.channel),bumpMapUv:Yt&&p(v.bumpMap.channel),normalMapUv:Dt&&p(v.normalMap.channel),displacementMapUv:ue&&p(v.displacementMap.channel),emissiveMapUv:Ot&&p(v.emissiveMap.channel),metalnessMapUv:C&&p(v.metalnessMap.channel),roughnessMapUv:T&&p(v.roughnessMap.channel),anisotropyMapUv:vt&&p(v.anisotropyMap.channel),clearcoatMapUv:Qt&&p(v.clearcoatMap.channel),clearcoatNormalMapUv:at&&p(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:yt&&p(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Bt&&p(v.iridescenceMap.channel),iridescenceThicknessMapUv:zt&&p(v.iridescenceThicknessMap.channel),sheenColorMapUv:St&&p(v.sheenColorMap.channel),sheenRoughnessMapUv:Zt&&p(v.sheenRoughnessMap.channel),specularMapUv:Ht&&p(v.specularMap.channel),specularColorMapUv:fe&&p(v.specularColorMap.channel),specularIntensityMapUv:B&&p(v.specularIntensityMap.channel),transmissionMapUv:xt&&p(v.transmissionMap.channel),thicknessMapUv:Z&&p(v.thicknessMap.channel),alphaMapUv:mt&&p(v.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(Dt||V),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!O.attributes.uv&&(wt||mt),fog:!!q,useFog:v.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:u,skinning:F.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:pt,morphTextureStride:It,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:r.shadowMap.enabled&&I.length>0,shadowMapType:r.shadowMap.type,toneMapping:$e,decodeVideoTexture:wt&&v.map.isVideoTexture===!0&&ee.getTransfer(v.map.colorSpace)===ge,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Rn,flipSided:v.side===tn,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ye&&v.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ye&&v.extensions.multiDraw===!0||ot)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return ne.vertexUv1s=c.has(1),ne.vertexUv2s=c.has(2),ne.vertexUv3s=c.has(3),c.clear(),ne}function x(v){const S=[];if(v.shaderID?S.push(v.shaderID):(S.push(v.customVertexShaderID),S.push(v.customFragmentShaderID)),v.defines!==void 0)for(const I in v.defines)S.push(I),S.push(v.defines[I]);return v.isRawShaderMaterial===!1&&(M(S,v),y(S,v),S.push(r.outputColorSpace)),S.push(v.customProgramCacheKey),S.join()}function M(v,S){v.push(S.precision),v.push(S.outputColorSpace),v.push(S.envMapMode),v.push(S.envMapCubeUVHeight),v.push(S.mapUv),v.push(S.alphaMapUv),v.push(S.lightMapUv),v.push(S.aoMapUv),v.push(S.bumpMapUv),v.push(S.normalMapUv),v.push(S.displacementMapUv),v.push(S.emissiveMapUv),v.push(S.metalnessMapUv),v.push(S.roughnessMapUv),v.push(S.anisotropyMapUv),v.push(S.clearcoatMapUv),v.push(S.clearcoatNormalMapUv),v.push(S.clearcoatRoughnessMapUv),v.push(S.iridescenceMapUv),v.push(S.iridescenceThicknessMapUv),v.push(S.sheenColorMapUv),v.push(S.sheenRoughnessMapUv),v.push(S.specularMapUv),v.push(S.specularColorMapUv),v.push(S.specularIntensityMapUv),v.push(S.transmissionMapUv),v.push(S.thicknessMapUv),v.push(S.combine),v.push(S.fogExp2),v.push(S.sizeAttenuation),v.push(S.morphTargetsCount),v.push(S.morphAttributeCount),v.push(S.numDirLights),v.push(S.numPointLights),v.push(S.numSpotLights),v.push(S.numSpotLightMaps),v.push(S.numHemiLights),v.push(S.numRectAreaLights),v.push(S.numDirLightShadows),v.push(S.numPointLightShadows),v.push(S.numSpotLightShadows),v.push(S.numSpotLightShadowsWithMaps),v.push(S.numLightProbes),v.push(S.shadowMapType),v.push(S.toneMapping),v.push(S.numClippingPlanes),v.push(S.numClipIntersection),v.push(S.depthPacking)}function y(v,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),v.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reverseDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.alphaToCoverage&&a.enable(20),v.push(a.mask)}function A(v){const S=_[v.type];let I;if(S){const D=zn[S];I=rf.clone(D.uniforms)}else I=v.uniforms;return I}function w(v,S){let I;for(let D=0,F=h.length;D<F;D++){const q=h[D];if(q.cacheKey===S){I=q,++I.usedTimes;break}}return I===void 0&&(I=new xg(r,S,v,s),h.push(I)),I}function E(v){if(--v.usedTimes===0){const S=h.indexOf(v);h[S]=h[h.length-1],h.pop(),v.destroy()}}function L(v){l.remove(v)}function U(){l.dispose()}return{getParameters:g,getProgramCacheKey:x,getUniforms:A,acquireProgram:w,releaseProgram:E,releaseShaderCache:L,programs:h,dispose:U}}function Eg(){let r=new WeakMap;function t(o){return r.has(o)}function e(o){let a=r.get(o);return a===void 0&&(a={},r.set(o,a)),a}function n(o){r.delete(o)}function i(o,a,l){r.get(o)[a]=l}function s(){r=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function Tg(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.z!==t.z?r.z-t.z:r.id-t.id}function Xc(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function Yc(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function o(d,u,f,m,_,p){let g=r[t];return g===void 0?(g={id:d.id,object:d,geometry:u,material:f,groupOrder:m,renderOrder:d.renderOrder,z:_,group:p},r[t]=g):(g.id=d.id,g.object=d,g.geometry=u,g.material=f,g.groupOrder=m,g.renderOrder=d.renderOrder,g.z=_,g.group=p),t++,g}function a(d,u,f,m,_,p){const g=o(d,u,f,m,_,p);f.transmission>0?n.push(g):f.transparent===!0?i.push(g):e.push(g)}function l(d,u,f,m,_,p){const g=o(d,u,f,m,_,p);f.transmission>0?n.unshift(g):f.transparent===!0?i.unshift(g):e.unshift(g)}function c(d,u){e.length>1&&e.sort(d||Tg),n.length>1&&n.sort(u||Xc),i.length>1&&i.sort(u||Xc)}function h(){for(let d=t,u=r.length;d<u;d++){const f=r[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:a,unshift:l,finish:h,sort:c}}function Ag(){let r=new WeakMap;function t(n,i){const s=r.get(n);let o;return s===void 0?(o=new Yc,r.set(n,[o])):i>=s.length?(o=new Yc,s.push(o)):o=s[i],o}function e(){r=new WeakMap}return{get:t,dispose:e}}function wg(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new Lt};break;case"SpotLight":e={position:new P,direction:new P,color:new Lt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new Lt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new Lt,groundColor:new Lt};break;case"RectAreaLight":e={color:new Lt,position:new P,halfWidth:new P,halfHeight:new P};break}return r[t.id]=e,e}}}function bg(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new jt,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let Rg=0;function Cg(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function Pg(r){const t=new wg,e=bg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new P);const i=new P,s=new Gt,o=new Gt;function a(c){let h=0,d=0,u=0;for(let U=0;U<9;U++)n.probe[U].set(0,0,0);let f=0,m=0,_=0,p=0,g=0,x=0,M=0,y=0,A=0,w=0,E=0;c.sort(Cg);for(let U=0,v=c.length;U<v;U++){const S=c[U],I=S.color,D=S.intensity,F=S.distance,q=S.shadow&&S.shadow.map?S.shadow.map.texture:null;if(S.isAmbientLight)h+=I.r*D,d+=I.g*D,u+=I.b*D;else if(S.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(S.sh.coefficients[O],D);E++}else if(S.isDirectionalLight){const O=t.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){const z=S.shadow,G=e.get(S);G.shadowIntensity=z.intensity,G.shadowBias=z.bias,G.shadowNormalBias=z.normalBias,G.shadowRadius=z.radius,G.shadowMapSize=z.mapSize,n.directionalShadow[f]=G,n.directionalShadowMap[f]=q,n.directionalShadowMatrix[f]=S.shadow.matrix,x++}n.directional[f]=O,f++}else if(S.isSpotLight){const O=t.get(S);O.position.setFromMatrixPosition(S.matrixWorld),O.color.copy(I).multiplyScalar(D),O.distance=F,O.coneCos=Math.cos(S.angle),O.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),O.decay=S.decay,n.spot[_]=O;const z=S.shadow;if(S.map&&(n.spotLightMap[A]=S.map,A++,z.updateMatrices(S),S.castShadow&&w++),n.spotLightMatrix[_]=z.matrix,S.castShadow){const G=e.get(S);G.shadowIntensity=z.intensity,G.shadowBias=z.bias,G.shadowNormalBias=z.normalBias,G.shadowRadius=z.radius,G.shadowMapSize=z.mapSize,n.spotShadow[_]=G,n.spotShadowMap[_]=q,y++}_++}else if(S.isRectAreaLight){const O=t.get(S);O.color.copy(I).multiplyScalar(D),O.halfWidth.set(S.width*.5,0,0),O.halfHeight.set(0,S.height*.5,0),n.rectArea[p]=O,p++}else if(S.isPointLight){const O=t.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),O.distance=S.distance,O.decay=S.decay,S.castShadow){const z=S.shadow,G=e.get(S);G.shadowIntensity=z.intensity,G.shadowBias=z.bias,G.shadowNormalBias=z.normalBias,G.shadowRadius=z.radius,G.shadowMapSize=z.mapSize,G.shadowCameraNear=z.camera.near,G.shadowCameraFar=z.camera.far,n.pointShadow[m]=G,n.pointShadowMap[m]=q,n.pointShadowMatrix[m]=S.shadow.matrix,M++}n.point[m]=O,m++}else if(S.isHemisphereLight){const O=t.get(S);O.skyColor.copy(S.color).multiplyScalar(D),O.groundColor.copy(S.groundColor).multiplyScalar(D),n.hemi[g]=O,g++}}p>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ut.LTC_FLOAT_1,n.rectAreaLTC2=ut.LTC_FLOAT_2):(n.rectAreaLTC1=ut.LTC_HALF_1,n.rectAreaLTC2=ut.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const L=n.hash;(L.directionalLength!==f||L.pointLength!==m||L.spotLength!==_||L.rectAreaLength!==p||L.hemiLength!==g||L.numDirectionalShadows!==x||L.numPointShadows!==M||L.numSpotShadows!==y||L.numSpotMaps!==A||L.numLightProbes!==E)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=x,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=y+A-w,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=E,L.directionalLength=f,L.pointLength=m,L.spotLength=_,L.rectAreaLength=p,L.hemiLength=g,L.numDirectionalShadows=x,L.numPointShadows=M,L.numSpotShadows=y,L.numSpotMaps=A,L.numLightProbes=E,n.version=Rg++)}function l(c,h){let d=0,u=0,f=0,m=0,_=0;const p=h.matrixWorldInverse;for(let g=0,x=c.length;g<x;g++){const M=c[g];if(M.isDirectionalLight){const y=n.directional[d];y.direction.setFromMatrixPosition(M.matrixWorld),i.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),d++}else if(M.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(M.matrixWorld),i.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),f++}else if(M.isRectAreaLight){const y=n.rectArea[m];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),o.identity(),s.copy(M.matrixWorld),s.premultiply(p),o.extractRotation(s),y.halfWidth.set(M.width*.5,0,0),y.halfHeight.set(0,M.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(M.isPointLight){const y=n.point[u];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),u++}else if(M.isHemisphereLight){const y=n.hemi[_];y.direction.setFromMatrixPosition(M.matrixWorld),y.direction.transformDirection(p),_++}}}return{setup:a,setupView:l,state:n}}function qc(r){const t=new Pg(r),e=[],n=[];function i(h){c.camera=h,e.length=0,n.length=0}function s(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function Lg(r){let t=new WeakMap;function e(i,s=0){const o=t.get(i);let a;return o===void 0?(a=new qc(r),t.set(i,[a])):s>=o.length?(a=new qc(r),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class Ig extends kn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=du,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Dg extends kn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Ng=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Og=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Ug(r,t,e){let n=new Al;const i=new jt,s=new jt,o=new se,a=new Ig({depthPacking:uu}),l=new Dg,c={},h=e.maxTextureSize,d={[Vn]:tn,[tn]:Vn,[Rn]:Rn},u=new wi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new jt},radius:{value:4}},vertexShader:Ng,fragmentShader:Og}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const m=new Ye;m.setAttribute("position",new Te(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new ht(m,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ch;let g=this.type;this.render=function(w,E,L){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;const U=r.getRenderTarget(),v=r.getActiveCubeFace(),S=r.getActiveMipmapLevel(),I=r.state;I.setBlending(Ti),I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const D=g!==si&&this.type===si,F=g===si&&this.type!==si;for(let q=0,O=w.length;q<O;q++){const z=w[q],G=z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;i.copy(G.mapSize);const et=G.getFrameExtents();if(i.multiply(et),s.copy(G.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/et.x),i.x=s.x*et.x,G.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/et.y),i.y=s.y*et.y,G.mapSize.y=s.y)),G.map===null||D===!0||F===!0){const j=this.type!==si?{minFilter:je,magFilter:je}:{};G.map!==null&&G.map.dispose(),G.map=new Xi(i.x,i.y,j),G.map.texture.name=z.name+".shadowMap",G.camera.updateProjectionMatrix()}r.setRenderTarget(G.map),r.clear();const K=G.getViewportCount();for(let j=0;j<K;j++){const pt=G.getViewport(j);o.set(s.x*pt.x,s.y*pt.y,s.x*pt.z,s.y*pt.w),I.viewport(o),G.updateMatrices(z,j),n=G.getFrustum(),y(E,L,G.camera,z,this.type)}G.isPointLightShadow!==!0&&this.type===si&&x(G,L),G.needsUpdate=!1}g=this.type,p.needsUpdate=!1,r.setRenderTarget(U,v,S)};function x(w,E){const L=t.update(_);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Xi(i.x,i.y)),u.uniforms.shadow_pass.value=w.map.texture,u.uniforms.resolution.value=w.mapSize,u.uniforms.radius.value=w.radius,r.setRenderTarget(w.mapPass),r.clear(),r.renderBufferDirect(E,null,L,u,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,r.setRenderTarget(w.map),r.clear(),r.renderBufferDirect(E,null,L,f,_,null)}function M(w,E,L,U){let v=null;const S=L.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(S!==void 0)v=S;else if(v=L.isPointLight===!0?l:a,r.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const I=v.uuid,D=E.uuid;let F=c[I];F===void 0&&(F={},c[I]=F);let q=F[D];q===void 0&&(q=v.clone(),F[D]=q,E.addEventListener("dispose",A)),v=q}if(v.visible=E.visible,v.wireframe=E.wireframe,U===si?v.side=E.shadowSide!==null?E.shadowSide:E.side:v.side=E.shadowSide!==null?E.shadowSide:d[E.side],v.alphaMap=E.alphaMap,v.alphaTest=E.alphaTest,v.map=E.map,v.clipShadows=E.clipShadows,v.clippingPlanes=E.clippingPlanes,v.clipIntersection=E.clipIntersection,v.displacementMap=E.displacementMap,v.displacementScale=E.displacementScale,v.displacementBias=E.displacementBias,v.wireframeLinewidth=E.wireframeLinewidth,v.linewidth=E.linewidth,L.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const I=r.properties.get(v);I.light=L}return v}function y(w,E,L,U,v){if(w.visible===!1)return;if(w.layers.test(E.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&v===si)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,w.matrixWorld);const D=t.update(w),F=w.material;if(Array.isArray(F)){const q=D.groups;for(let O=0,z=q.length;O<z;O++){const G=q[O],et=F[G.materialIndex];if(et&&et.visible){const K=M(w,et,U,v);w.onBeforeShadow(r,w,E,L,D,K,G),r.renderBufferDirect(L,null,D,K,w,G),w.onAfterShadow(r,w,E,L,D,K,G)}}}else if(F.visible){const q=M(w,F,U,v);w.onBeforeShadow(r,w,E,L,D,q,null),r.renderBufferDirect(L,null,D,q,w,null),w.onAfterShadow(r,w,E,L,D,q,null)}}const I=w.children;for(let D=0,F=I.length;D<F;D++)y(I[D],E,L,U,v)}function A(w){w.target.removeEventListener("dispose",A);for(const L in c){const U=c[L],v=w.target.uuid;v in U&&(U[v].dispose(),delete U[v])}}}const Fg={[ya]:Sa,[Ea]:wa,[Ta]:ba,[Ms]:Aa,[Sa]:ya,[wa]:Ea,[ba]:Ta,[Aa]:Ms};function Bg(r){function t(){let B=!1;const xt=new se;let Z=null;const nt=new se(0,0,0,0);return{setMask:function(mt){Z!==mt&&!B&&(r.colorMask(mt,mt,mt,mt),Z=mt)},setLocked:function(mt){B=mt},setClear:function(mt,Mt,Jt,ye,$e){$e===!0&&(mt*=ye,Mt*=ye,Jt*=ye),xt.set(mt,Mt,Jt,ye),nt.equals(xt)===!1&&(r.clearColor(mt,Mt,Jt,ye),nt.copy(xt))},reset:function(){B=!1,Z=null,nt.set(-1,0,0,0)}}}function e(){let B=!1,xt=!1,Z=null,nt=null,mt=null;return{setReversed:function(Mt){xt=Mt},setTest:function(Mt){Mt?rt(r.DEPTH_TEST):J(r.DEPTH_TEST)},setMask:function(Mt){Z!==Mt&&!B&&(r.depthMask(Mt),Z=Mt)},setFunc:function(Mt){if(xt&&(Mt=Fg[Mt]),nt!==Mt){switch(Mt){case ya:r.depthFunc(r.NEVER);break;case Sa:r.depthFunc(r.ALWAYS);break;case Ea:r.depthFunc(r.LESS);break;case Ms:r.depthFunc(r.LEQUAL);break;case Ta:r.depthFunc(r.EQUAL);break;case Aa:r.depthFunc(r.GEQUAL);break;case wa:r.depthFunc(r.GREATER);break;case ba:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}nt=Mt}},setLocked:function(Mt){B=Mt},setClear:function(Mt){mt!==Mt&&(r.clearDepth(Mt),mt=Mt)},reset:function(){B=!1,Z=null,nt=null,mt=null}}}function n(){let B=!1,xt=null,Z=null,nt=null,mt=null,Mt=null,Jt=null,ye=null,$e=null;return{setTest:function(ne){B||(ne?rt(r.STENCIL_TEST):J(r.STENCIL_TEST))},setMask:function(ne){xt!==ne&&!B&&(r.stencilMask(ne),xt=ne)},setFunc:function(ne,Ze,Kn){(Z!==ne||nt!==Ze||mt!==Kn)&&(r.stencilFunc(ne,Ze,Kn),Z=ne,nt=Ze,mt=Kn)},setOp:function(ne,Ze,Kn){(Mt!==ne||Jt!==Ze||ye!==Kn)&&(r.stencilOp(ne,Ze,Kn),Mt=ne,Jt=Ze,ye=Kn)},setLocked:function(ne){B=ne},setClear:function(ne){$e!==ne&&(r.clearStencil(ne),$e=ne)},reset:function(){B=!1,xt=null,Z=null,nt=null,mt=null,Mt=null,Jt=null,ye=null,$e=null}}}const i=new t,s=new e,o=new n,a=new WeakMap,l=new WeakMap;let c={},h={},d=new WeakMap,u=[],f=null,m=!1,_=null,p=null,g=null,x=null,M=null,y=null,A=null,w=new Lt(0,0,0),E=0,L=!1,U=null,v=null,S=null,I=null,D=null;const F=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,O=0;const z=r.getParameter(r.VERSION);z.indexOf("WebGL")!==-1?(O=parseFloat(/^WebGL (\d)/.exec(z)[1]),q=O>=1):z.indexOf("OpenGL ES")!==-1&&(O=parseFloat(/^OpenGL ES (\d)/.exec(z)[1]),q=O>=2);let G=null,et={};const K=r.getParameter(r.SCISSOR_BOX),j=r.getParameter(r.VIEWPORT),pt=new se().fromArray(K),It=new se().fromArray(j);function X(B,xt,Z,nt){const mt=new Uint8Array(4),Mt=r.createTexture();r.bindTexture(B,Mt),r.texParameteri(B,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(B,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Jt=0;Jt<Z;Jt++)B===r.TEXTURE_3D||B===r.TEXTURE_2D_ARRAY?r.texImage3D(xt,0,r.RGBA,1,1,nt,0,r.RGBA,r.UNSIGNED_BYTE,mt):r.texImage2D(xt+Jt,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,mt);return Mt}const $={};$[r.TEXTURE_2D]=X(r.TEXTURE_2D,r.TEXTURE_2D,1),$[r.TEXTURE_CUBE_MAP]=X(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[r.TEXTURE_2D_ARRAY]=X(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),$[r.TEXTURE_3D]=X(r.TEXTURE_3D,r.TEXTURE_3D,1,1),i.setClear(0,0,0,1),s.setClear(1),o.setClear(0),rt(r.DEPTH_TEST),s.setFunc(Ms),Xt(!1),Yt(Zl),rt(r.CULL_FACE),N(Ti);function rt(B){c[B]!==!0&&(r.enable(B),c[B]=!0)}function J(B){c[B]!==!1&&(r.disable(B),c[B]=!1)}function st(B,xt){return h[B]!==xt?(r.bindFramebuffer(B,xt),h[B]=xt,B===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=xt),B===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=xt),!0):!1}function lt(B,xt){let Z=u,nt=!1;if(B){Z=d.get(xt),Z===void 0&&(Z=[],d.set(xt,Z));const mt=B.textures;if(Z.length!==mt.length||Z[0]!==r.COLOR_ATTACHMENT0){for(let Mt=0,Jt=mt.length;Mt<Jt;Mt++)Z[Mt]=r.COLOR_ATTACHMENT0+Mt;Z.length=mt.length,nt=!0}}else Z[0]!==r.BACK&&(Z[0]=r.BACK,nt=!0);nt&&r.drawBuffers(Z)}function ot(B){return f!==B?(r.useProgram(B),f=B,!0):!1}const wt={[Gi]:r.FUNC_ADD,[Ud]:r.FUNC_SUBTRACT,[Fd]:r.FUNC_REVERSE_SUBTRACT};wt[Bd]=r.MIN,wt[zd]=r.MAX;const Ct={[Hd]:r.ZERO,[Gd]:r.ONE,[kd]:r.SRC_COLOR,[Ma]:r.SRC_ALPHA,[Kd]:r.SRC_ALPHA_SATURATE,[Yd]:r.DST_COLOR,[Wd]:r.DST_ALPHA,[Vd]:r.ONE_MINUS_SRC_COLOR,[va]:r.ONE_MINUS_SRC_ALPHA,[qd]:r.ONE_MINUS_DST_COLOR,[Xd]:r.ONE_MINUS_DST_ALPHA,[jd]:r.CONSTANT_COLOR,[$d]:r.ONE_MINUS_CONSTANT_COLOR,[Zd]:r.CONSTANT_ALPHA,[Jd]:r.ONE_MINUS_CONSTANT_ALPHA};function N(B,xt,Z,nt,mt,Mt,Jt,ye,$e,ne){if(B===Ti){m===!0&&(J(r.BLEND),m=!1);return}if(m===!1&&(rt(r.BLEND),m=!0),B!==Od){if(B!==_||ne!==L){if((p!==Gi||M!==Gi)&&(r.blendEquation(r.FUNC_ADD),p=Gi,M=Gi),ne)switch(B){case ms:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Jl:r.blendFunc(r.ONE,r.ONE);break;case Ql:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case tc:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case ms:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Jl:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case Ql:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case tc:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}g=null,x=null,y=null,A=null,w.set(0,0,0),E=0,_=B,L=ne}return}mt=mt||xt,Mt=Mt||Z,Jt=Jt||nt,(xt!==p||mt!==M)&&(r.blendEquationSeparate(wt[xt],wt[mt]),p=xt,M=mt),(Z!==g||nt!==x||Mt!==y||Jt!==A)&&(r.blendFuncSeparate(Ct[Z],Ct[nt],Ct[Mt],Ct[Jt]),g=Z,x=nt,y=Mt,A=Jt),(ye.equals(w)===!1||$e!==E)&&(r.blendColor(ye.r,ye.g,ye.b,$e),w.copy(ye),E=$e),_=B,L=!1}function Ee(B,xt){B.side===Rn?J(r.CULL_FACE):rt(r.CULL_FACE);let Z=B.side===tn;xt&&(Z=!Z),Xt(Z),B.blending===ms&&B.transparent===!1?N(Ti):N(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),s.setFunc(B.depthFunc),s.setTest(B.depthTest),s.setMask(B.depthWrite),i.setMask(B.colorWrite);const nt=B.stencilWrite;o.setTest(nt),nt&&(o.setMask(B.stencilWriteMask),o.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),o.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),ue(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?rt(r.SAMPLE_ALPHA_TO_COVERAGE):J(r.SAMPLE_ALPHA_TO_COVERAGE)}function Xt(B){U!==B&&(B?r.frontFace(r.CW):r.frontFace(r.CCW),U=B)}function Yt(B){B!==Dd?(rt(r.CULL_FACE),B!==v&&(B===Zl?r.cullFace(r.BACK):B===Nd?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):J(r.CULL_FACE),v=B}function Dt(B){B!==S&&(q&&r.lineWidth(B),S=B)}function ue(B,xt,Z){B?(rt(r.POLYGON_OFFSET_FILL),(I!==xt||D!==Z)&&(r.polygonOffset(xt,Z),I=xt,D=Z)):J(r.POLYGON_OFFSET_FILL)}function Ot(B){B?rt(r.SCISSOR_TEST):J(r.SCISSOR_TEST)}function C(B){B===void 0&&(B=r.TEXTURE0+F-1),G!==B&&(r.activeTexture(B),G=B)}function T(B,xt,Z){Z===void 0&&(G===null?Z=r.TEXTURE0+F-1:Z=G);let nt=et[Z];nt===void 0&&(nt={type:void 0,texture:void 0},et[Z]=nt),(nt.type!==B||nt.texture!==xt)&&(G!==Z&&(r.activeTexture(Z),G=Z),r.bindTexture(B,xt||$[B]),nt.type=B,nt.texture=xt)}function V(){const B=et[G];B!==void 0&&B.type!==void 0&&(r.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function Q(){try{r.compressedTexImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function it(){try{r.compressedTexImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function tt(){try{r.texSubImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Tt(){try{r.texSubImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ft(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function vt(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Qt(){try{r.texStorage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function at(){try{r.texStorage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function yt(){try{r.texImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Bt(){try{r.texImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function zt(B){pt.equals(B)===!1&&(r.scissor(B.x,B.y,B.z,B.w),pt.copy(B))}function St(B){It.equals(B)===!1&&(r.viewport(B.x,B.y,B.z,B.w),It.copy(B))}function Zt(B,xt){let Z=l.get(xt);Z===void 0&&(Z=new WeakMap,l.set(xt,Z));let nt=Z.get(B);nt===void 0&&(nt=r.getUniformBlockIndex(xt,B.name),Z.set(B,nt))}function Ht(B,xt){const nt=l.get(xt).get(B);a.get(xt)!==nt&&(r.uniformBlockBinding(xt,nt,B.__bindingPointIndex),a.set(xt,nt))}function fe(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),c={},G=null,et={},h={},d=new WeakMap,u=[],f=null,m=!1,_=null,p=null,g=null,x=null,M=null,y=null,A=null,w=new Lt(0,0,0),E=0,L=!1,U=null,v=null,S=null,I=null,D=null,pt.set(0,0,r.canvas.width,r.canvas.height),It.set(0,0,r.canvas.width,r.canvas.height),i.reset(),s.reset(),o.reset()}return{buffers:{color:i,depth:s,stencil:o},enable:rt,disable:J,bindFramebuffer:st,drawBuffers:lt,useProgram:ot,setBlending:N,setMaterial:Ee,setFlipSided:Xt,setCullFace:Yt,setLineWidth:Dt,setPolygonOffset:ue,setScissorTest:Ot,activeTexture:C,bindTexture:T,unbindTexture:V,compressedTexImage2D:Q,compressedTexImage3D:it,texImage2D:yt,texImage3D:Bt,updateUBOMapping:Zt,uniformBlockBinding:Ht,texStorage2D:Qt,texStorage3D:at,texSubImage2D:tt,texSubImage3D:Tt,compressedTexSubImage2D:ft,compressedTexSubImage3D:vt,scissor:zt,viewport:St,reset:fe}}function Kc(r,t,e,n){const i=zg(n);switch(e){case Fh:return r*t;case zh:return r*t;case Hh:return r*t*2;case Ml:return r*t/i.components*i.byteLength;case vl:return r*t/i.components*i.byteLength;case Gh:return r*t*2/i.components*i.byteLength;case yl:return r*t*2/i.components*i.byteLength;case Bh:return r*t*3/i.components*i.byteLength;case fn:return r*t*4/i.components*i.byteLength;case Sl:return r*t*4/i.components*i.byteLength;case no:case io:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case so:case ro:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case La:case Da:return Math.max(r,16)*Math.max(t,8)/4;case Pa:case Ia:return Math.max(r,8)*Math.max(t,8)/2;case Na:case Oa:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Ua:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Fa:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Ba:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case za:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case Ha:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case Ga:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case ka:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case Va:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case Wa:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case Xa:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case Ya:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case qa:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case Ka:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case ja:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case $a:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case oo:case Za:case Ja:return Math.ceil(r/4)*Math.ceil(t/4)*16;case kh:case Qa:return Math.ceil(r/4)*Math.ceil(t/4)*8;case tl:case el:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function zg(r){switch(r){case ci:case Nh:return{byteLength:1,components:1};case dr:case Oh:case xr:return{byteLength:2,components:1};case _l:case xl:return{byteLength:2,components:4};case Wi:case gl:case Ln:return{byteLength:4,components:1};case Uh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function Hg(r,t,e,n,i,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new jt,h=new WeakMap;let d;const u=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(C,T){return f?new OffscreenCanvas(C,T):pr("canvas")}function _(C,T,V){let Q=1;const it=Ot(C);if((it.width>V||it.height>V)&&(Q=V/Math.max(it.width,it.height)),Q<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const tt=Math.floor(Q*it.width),Tt=Math.floor(Q*it.height);d===void 0&&(d=m(tt,Tt));const ft=T?m(tt,Tt):d;return ft.width=tt,ft.height=Tt,ft.getContext("2d").drawImage(C,0,0,tt,Tt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+it.width+"x"+it.height+") to ("+tt+"x"+Tt+")."),ft}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+it.width+"x"+it.height+")."),C;return C}function p(C){return C.generateMipmaps&&C.minFilter!==je&&C.minFilter!==an}function g(C){r.generateMipmap(C)}function x(C,T,V,Q,it=!1){if(C!==null){if(r[C]!==void 0)return r[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let tt=T;if(T===r.RED&&(V===r.FLOAT&&(tt=r.R32F),V===r.HALF_FLOAT&&(tt=r.R16F),V===r.UNSIGNED_BYTE&&(tt=r.R8)),T===r.RED_INTEGER&&(V===r.UNSIGNED_BYTE&&(tt=r.R8UI),V===r.UNSIGNED_SHORT&&(tt=r.R16UI),V===r.UNSIGNED_INT&&(tt=r.R32UI),V===r.BYTE&&(tt=r.R8I),V===r.SHORT&&(tt=r.R16I),V===r.INT&&(tt=r.R32I)),T===r.RG&&(V===r.FLOAT&&(tt=r.RG32F),V===r.HALF_FLOAT&&(tt=r.RG16F),V===r.UNSIGNED_BYTE&&(tt=r.RG8)),T===r.RG_INTEGER&&(V===r.UNSIGNED_BYTE&&(tt=r.RG8UI),V===r.UNSIGNED_SHORT&&(tt=r.RG16UI),V===r.UNSIGNED_INT&&(tt=r.RG32UI),V===r.BYTE&&(tt=r.RG8I),V===r.SHORT&&(tt=r.RG16I),V===r.INT&&(tt=r.RG32I)),T===r.RGB_INTEGER&&(V===r.UNSIGNED_BYTE&&(tt=r.RGB8UI),V===r.UNSIGNED_SHORT&&(tt=r.RGB16UI),V===r.UNSIGNED_INT&&(tt=r.RGB32UI),V===r.BYTE&&(tt=r.RGB8I),V===r.SHORT&&(tt=r.RGB16I),V===r.INT&&(tt=r.RGB32I)),T===r.RGBA_INTEGER&&(V===r.UNSIGNED_BYTE&&(tt=r.RGBA8UI),V===r.UNSIGNED_SHORT&&(tt=r.RGBA16UI),V===r.UNSIGNED_INT&&(tt=r.RGBA32UI),V===r.BYTE&&(tt=r.RGBA8I),V===r.SHORT&&(tt=r.RGBA16I),V===r.INT&&(tt=r.RGBA32I)),T===r.RGB&&V===r.UNSIGNED_INT_5_9_9_9_REV&&(tt=r.RGB9_E5),T===r.RGBA){const Tt=it?ho:ee.getTransfer(Q);V===r.FLOAT&&(tt=r.RGBA32F),V===r.HALF_FLOAT&&(tt=r.RGBA16F),V===r.UNSIGNED_BYTE&&(tt=Tt===ge?r.SRGB8_ALPHA8:r.RGBA8),V===r.UNSIGNED_SHORT_4_4_4_4&&(tt=r.RGBA4),V===r.UNSIGNED_SHORT_5_5_5_1&&(tt=r.RGB5_A1)}return(tt===r.R16F||tt===r.R32F||tt===r.RG16F||tt===r.RG32F||tt===r.RGBA16F||tt===r.RGBA32F)&&t.get("EXT_color_buffer_float"),tt}function M(C,T){let V;return C?T===null||T===Wi||T===Es?V=r.DEPTH24_STENCIL8:T===Ln?V=r.DEPTH32F_STENCIL8:T===dr&&(V=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Wi||T===Es?V=r.DEPTH_COMPONENT24:T===Ln?V=r.DEPTH_COMPONENT32F:T===dr&&(V=r.DEPTH_COMPONENT16),V}function y(C,T){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==je&&C.minFilter!==an?Math.log2(Math.max(T.width,T.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?T.mipmaps.length:1}function A(C){const T=C.target;T.removeEventListener("dispose",A),E(T),T.isVideoTexture&&h.delete(T)}function w(C){const T=C.target;T.removeEventListener("dispose",w),U(T)}function E(C){const T=n.get(C);if(T.__webglInit===void 0)return;const V=C.source,Q=u.get(V);if(Q){const it=Q[T.__cacheKey];it.usedTimes--,it.usedTimes===0&&L(C),Object.keys(Q).length===0&&u.delete(V)}n.remove(C)}function L(C){const T=n.get(C);r.deleteTexture(T.__webglTexture);const V=C.source,Q=u.get(V);delete Q[T.__cacheKey],o.memory.textures--}function U(C){const T=n.get(C);if(C.depthTexture&&C.depthTexture.dispose(),C.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(T.__webglFramebuffer[Q]))for(let it=0;it<T.__webglFramebuffer[Q].length;it++)r.deleteFramebuffer(T.__webglFramebuffer[Q][it]);else r.deleteFramebuffer(T.__webglFramebuffer[Q]);T.__webglDepthbuffer&&r.deleteRenderbuffer(T.__webglDepthbuffer[Q])}else{if(Array.isArray(T.__webglFramebuffer))for(let Q=0;Q<T.__webglFramebuffer.length;Q++)r.deleteFramebuffer(T.__webglFramebuffer[Q]);else r.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&r.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&r.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let Q=0;Q<T.__webglColorRenderbuffer.length;Q++)T.__webglColorRenderbuffer[Q]&&r.deleteRenderbuffer(T.__webglColorRenderbuffer[Q]);T.__webglDepthRenderbuffer&&r.deleteRenderbuffer(T.__webglDepthRenderbuffer)}const V=C.textures;for(let Q=0,it=V.length;Q<it;Q++){const tt=n.get(V[Q]);tt.__webglTexture&&(r.deleteTexture(tt.__webglTexture),o.memory.textures--),n.remove(V[Q])}n.remove(C)}let v=0;function S(){v=0}function I(){const C=v;return C>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+i.maxTextures),v+=1,C}function D(C){const T=[];return T.push(C.wrapS),T.push(C.wrapT),T.push(C.wrapR||0),T.push(C.magFilter),T.push(C.minFilter),T.push(C.anisotropy),T.push(C.internalFormat),T.push(C.format),T.push(C.type),T.push(C.generateMipmaps),T.push(C.premultiplyAlpha),T.push(C.flipY),T.push(C.unpackAlignment),T.push(C.colorSpace),T.join()}function F(C,T){const V=n.get(C);if(C.isVideoTexture&&Dt(C),C.isRenderTargetTexture===!1&&C.version>0&&V.__version!==C.version){const Q=C.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{It(V,C,T);return}}e.bindTexture(r.TEXTURE_2D,V.__webglTexture,r.TEXTURE0+T)}function q(C,T){const V=n.get(C);if(C.version>0&&V.__version!==C.version){It(V,C,T);return}e.bindTexture(r.TEXTURE_2D_ARRAY,V.__webglTexture,r.TEXTURE0+T)}function O(C,T){const V=n.get(C);if(C.version>0&&V.__version!==C.version){It(V,C,T);return}e.bindTexture(r.TEXTURE_3D,V.__webglTexture,r.TEXTURE0+T)}function z(C,T){const V=n.get(C);if(C.version>0&&V.__version!==C.version){X(V,C,T);return}e.bindTexture(r.TEXTURE_CUBE_MAP,V.__webglTexture,r.TEXTURE0+T)}const G={[Ss]:r.REPEAT,[Si]:r.CLAMP_TO_EDGE,[co]:r.MIRRORED_REPEAT},et={[je]:r.NEAREST,[Dh]:r.NEAREST_MIPMAP_NEAREST,[er]:r.NEAREST_MIPMAP_LINEAR,[an]:r.LINEAR,[eo]:r.LINEAR_MIPMAP_NEAREST,[ai]:r.LINEAR_MIPMAP_LINEAR},K={[pu]:r.NEVER,[vu]:r.ALWAYS,[mu]:r.LESS,[Xh]:r.LEQUAL,[gu]:r.EQUAL,[Mu]:r.GEQUAL,[_u]:r.GREATER,[xu]:r.NOTEQUAL};function j(C,T){if(T.type===Ln&&t.has("OES_texture_float_linear")===!1&&(T.magFilter===an||T.magFilter===eo||T.magFilter===er||T.magFilter===ai||T.minFilter===an||T.minFilter===eo||T.minFilter===er||T.minFilter===ai)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(C,r.TEXTURE_WRAP_S,G[T.wrapS]),r.texParameteri(C,r.TEXTURE_WRAP_T,G[T.wrapT]),(C===r.TEXTURE_3D||C===r.TEXTURE_2D_ARRAY)&&r.texParameteri(C,r.TEXTURE_WRAP_R,G[T.wrapR]),r.texParameteri(C,r.TEXTURE_MAG_FILTER,et[T.magFilter]),r.texParameteri(C,r.TEXTURE_MIN_FILTER,et[T.minFilter]),T.compareFunction&&(r.texParameteri(C,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(C,r.TEXTURE_COMPARE_FUNC,K[T.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===je||T.minFilter!==er&&T.minFilter!==ai||T.type===Ln&&t.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||n.get(T).__currentAnisotropy){const V=t.get("EXT_texture_filter_anisotropic");r.texParameterf(C,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,i.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy}}}function pt(C,T){let V=!1;C.__webglInit===void 0&&(C.__webglInit=!0,T.addEventListener("dispose",A));const Q=T.source;let it=u.get(Q);it===void 0&&(it={},u.set(Q,it));const tt=D(T);if(tt!==C.__cacheKey){it[tt]===void 0&&(it[tt]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,V=!0),it[tt].usedTimes++;const Tt=it[C.__cacheKey];Tt!==void 0&&(it[C.__cacheKey].usedTimes--,Tt.usedTimes===0&&L(T)),C.__cacheKey=tt,C.__webglTexture=it[tt].texture}return V}function It(C,T,V){let Q=r.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(Q=r.TEXTURE_2D_ARRAY),T.isData3DTexture&&(Q=r.TEXTURE_3D);const it=pt(C,T),tt=T.source;e.bindTexture(Q,C.__webglTexture,r.TEXTURE0+V);const Tt=n.get(tt);if(tt.version!==Tt.__version||it===!0){e.activeTexture(r.TEXTURE0+V);const ft=ee.getPrimaries(ee.workingColorSpace),vt=T.colorSpace===yi?null:ee.getPrimaries(T.colorSpace),Qt=T.colorSpace===yi||ft===vt?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,T.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,T.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Qt);let at=_(T.image,!1,i.maxTextureSize);at=ue(T,at);const yt=s.convert(T.format,T.colorSpace),Bt=s.convert(T.type);let zt=x(T.internalFormat,yt,Bt,T.colorSpace,T.isVideoTexture);j(Q,T);let St;const Zt=T.mipmaps,Ht=T.isVideoTexture!==!0,fe=Tt.__version===void 0||it===!0,B=tt.dataReady,xt=y(T,at);if(T.isDepthTexture)zt=M(T.format===Ts,T.type),fe&&(Ht?e.texStorage2D(r.TEXTURE_2D,1,zt,at.width,at.height):e.texImage2D(r.TEXTURE_2D,0,zt,at.width,at.height,0,yt,Bt,null));else if(T.isDataTexture)if(Zt.length>0){Ht&&fe&&e.texStorage2D(r.TEXTURE_2D,xt,zt,Zt[0].width,Zt[0].height);for(let Z=0,nt=Zt.length;Z<nt;Z++)St=Zt[Z],Ht?B&&e.texSubImage2D(r.TEXTURE_2D,Z,0,0,St.width,St.height,yt,Bt,St.data):e.texImage2D(r.TEXTURE_2D,Z,zt,St.width,St.height,0,yt,Bt,St.data);T.generateMipmaps=!1}else Ht?(fe&&e.texStorage2D(r.TEXTURE_2D,xt,zt,at.width,at.height),B&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,at.width,at.height,yt,Bt,at.data)):e.texImage2D(r.TEXTURE_2D,0,zt,at.width,at.height,0,yt,Bt,at.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){Ht&&fe&&e.texStorage3D(r.TEXTURE_2D_ARRAY,xt,zt,Zt[0].width,Zt[0].height,at.depth);for(let Z=0,nt=Zt.length;Z<nt;Z++)if(St=Zt[Z],T.format!==fn)if(yt!==null)if(Ht){if(B)if(T.layerUpdates.size>0){const mt=Kc(St.width,St.height,T.format,T.type);for(const Mt of T.layerUpdates){const Jt=St.data.subarray(Mt*mt/St.data.BYTES_PER_ELEMENT,(Mt+1)*mt/St.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,Mt,St.width,St.height,1,yt,Jt,0,0)}T.clearLayerUpdates()}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,0,St.width,St.height,at.depth,yt,St.data,0,0)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,Z,zt,St.width,St.height,at.depth,0,St.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ht?B&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,0,St.width,St.height,at.depth,yt,Bt,St.data):e.texImage3D(r.TEXTURE_2D_ARRAY,Z,zt,St.width,St.height,at.depth,0,yt,Bt,St.data)}else{Ht&&fe&&e.texStorage2D(r.TEXTURE_2D,xt,zt,Zt[0].width,Zt[0].height);for(let Z=0,nt=Zt.length;Z<nt;Z++)St=Zt[Z],T.format!==fn?yt!==null?Ht?B&&e.compressedTexSubImage2D(r.TEXTURE_2D,Z,0,0,St.width,St.height,yt,St.data):e.compressedTexImage2D(r.TEXTURE_2D,Z,zt,St.width,St.height,0,St.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ht?B&&e.texSubImage2D(r.TEXTURE_2D,Z,0,0,St.width,St.height,yt,Bt,St.data):e.texImage2D(r.TEXTURE_2D,Z,zt,St.width,St.height,0,yt,Bt,St.data)}else if(T.isDataArrayTexture)if(Ht){if(fe&&e.texStorage3D(r.TEXTURE_2D_ARRAY,xt,zt,at.width,at.height,at.depth),B)if(T.layerUpdates.size>0){const Z=Kc(at.width,at.height,T.format,T.type);for(const nt of T.layerUpdates){const mt=at.data.subarray(nt*Z/at.data.BYTES_PER_ELEMENT,(nt+1)*Z/at.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,nt,at.width,at.height,1,yt,Bt,mt)}T.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,yt,Bt,at.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,zt,at.width,at.height,at.depth,0,yt,Bt,at.data);else if(T.isData3DTexture)Ht?(fe&&e.texStorage3D(r.TEXTURE_3D,xt,zt,at.width,at.height,at.depth),B&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,yt,Bt,at.data)):e.texImage3D(r.TEXTURE_3D,0,zt,at.width,at.height,at.depth,0,yt,Bt,at.data);else if(T.isFramebufferTexture){if(fe)if(Ht)e.texStorage2D(r.TEXTURE_2D,xt,zt,at.width,at.height);else{let Z=at.width,nt=at.height;for(let mt=0;mt<xt;mt++)e.texImage2D(r.TEXTURE_2D,mt,zt,Z,nt,0,yt,Bt,null),Z>>=1,nt>>=1}}else if(Zt.length>0){if(Ht&&fe){const Z=Ot(Zt[0]);e.texStorage2D(r.TEXTURE_2D,xt,zt,Z.width,Z.height)}for(let Z=0,nt=Zt.length;Z<nt;Z++)St=Zt[Z],Ht?B&&e.texSubImage2D(r.TEXTURE_2D,Z,0,0,yt,Bt,St):e.texImage2D(r.TEXTURE_2D,Z,zt,yt,Bt,St);T.generateMipmaps=!1}else if(Ht){if(fe){const Z=Ot(at);e.texStorage2D(r.TEXTURE_2D,xt,zt,Z.width,Z.height)}B&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,yt,Bt,at)}else e.texImage2D(r.TEXTURE_2D,0,zt,yt,Bt,at);p(T)&&g(Q),Tt.__version=tt.version,T.onUpdate&&T.onUpdate(T)}C.__version=T.version}function X(C,T,V){if(T.image.length!==6)return;const Q=pt(C,T),it=T.source;e.bindTexture(r.TEXTURE_CUBE_MAP,C.__webglTexture,r.TEXTURE0+V);const tt=n.get(it);if(it.version!==tt.__version||Q===!0){e.activeTexture(r.TEXTURE0+V);const Tt=ee.getPrimaries(ee.workingColorSpace),ft=T.colorSpace===yi?null:ee.getPrimaries(T.colorSpace),vt=T.colorSpace===yi||Tt===ft?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,T.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,T.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,vt);const Qt=T.isCompressedTexture||T.image[0].isCompressedTexture,at=T.image[0]&&T.image[0].isDataTexture,yt=[];for(let nt=0;nt<6;nt++)!Qt&&!at?yt[nt]=_(T.image[nt],!0,i.maxCubemapSize):yt[nt]=at?T.image[nt].image:T.image[nt],yt[nt]=ue(T,yt[nt]);const Bt=yt[0],zt=s.convert(T.format,T.colorSpace),St=s.convert(T.type),Zt=x(T.internalFormat,zt,St,T.colorSpace),Ht=T.isVideoTexture!==!0,fe=tt.__version===void 0||Q===!0,B=it.dataReady;let xt=y(T,Bt);j(r.TEXTURE_CUBE_MAP,T);let Z;if(Qt){Ht&&fe&&e.texStorage2D(r.TEXTURE_CUBE_MAP,xt,Zt,Bt.width,Bt.height);for(let nt=0;nt<6;nt++){Z=yt[nt].mipmaps;for(let mt=0;mt<Z.length;mt++){const Mt=Z[mt];T.format!==fn?zt!==null?Ht?B&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt,0,0,Mt.width,Mt.height,zt,Mt.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt,Zt,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ht?B&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt,0,0,Mt.width,Mt.height,zt,St,Mt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt,Zt,Mt.width,Mt.height,0,zt,St,Mt.data)}}}else{if(Z=T.mipmaps,Ht&&fe){Z.length>0&&xt++;const nt=Ot(yt[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,xt,Zt,nt.width,nt.height)}for(let nt=0;nt<6;nt++)if(at){Ht?B&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,yt[nt].width,yt[nt].height,zt,St,yt[nt].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Zt,yt[nt].width,yt[nt].height,0,zt,St,yt[nt].data);for(let mt=0;mt<Z.length;mt++){const Jt=Z[mt].image[nt].image;Ht?B&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt+1,0,0,Jt.width,Jt.height,zt,St,Jt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt+1,Zt,Jt.width,Jt.height,0,zt,St,Jt.data)}}else{Ht?B&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,zt,St,yt[nt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Zt,zt,St,yt[nt]);for(let mt=0;mt<Z.length;mt++){const Mt=Z[mt];Ht?B&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt+1,0,0,zt,St,Mt.image[nt]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+nt,mt+1,Zt,zt,St,Mt.image[nt])}}}p(T)&&g(r.TEXTURE_CUBE_MAP),tt.__version=it.version,T.onUpdate&&T.onUpdate(T)}C.__version=T.version}function $(C,T,V,Q,it,tt){const Tt=s.convert(V.format,V.colorSpace),ft=s.convert(V.type),vt=x(V.internalFormat,Tt,ft,V.colorSpace);if(!n.get(T).__hasExternalTextures){const at=Math.max(1,T.width>>tt),yt=Math.max(1,T.height>>tt);it===r.TEXTURE_3D||it===r.TEXTURE_2D_ARRAY?e.texImage3D(it,tt,vt,at,yt,T.depth,0,Tt,ft,null):e.texImage2D(it,tt,vt,at,yt,0,Tt,ft,null)}e.bindFramebuffer(r.FRAMEBUFFER,C),Yt(T)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Q,it,n.get(V).__webglTexture,0,Xt(T)):(it===r.TEXTURE_2D||it>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&it<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Q,it,n.get(V).__webglTexture,tt),e.bindFramebuffer(r.FRAMEBUFFER,null)}function rt(C,T,V){if(r.bindRenderbuffer(r.RENDERBUFFER,C),T.depthBuffer){const Q=T.depthTexture,it=Q&&Q.isDepthTexture?Q.type:null,tt=M(T.stencilBuffer,it),Tt=T.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ft=Xt(T);Yt(T)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ft,tt,T.width,T.height):V?r.renderbufferStorageMultisample(r.RENDERBUFFER,ft,tt,T.width,T.height):r.renderbufferStorage(r.RENDERBUFFER,tt,T.width,T.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Tt,r.RENDERBUFFER,C)}else{const Q=T.textures;for(let it=0;it<Q.length;it++){const tt=Q[it],Tt=s.convert(tt.format,tt.colorSpace),ft=s.convert(tt.type),vt=x(tt.internalFormat,Tt,ft,tt.colorSpace),Qt=Xt(T);V&&Yt(T)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Qt,vt,T.width,T.height):Yt(T)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Qt,vt,T.width,T.height):r.renderbufferStorage(r.RENDERBUFFER,vt,T.width,T.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function J(C,T){if(T&&T.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(r.FRAMEBUFFER,C),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(T.depthTexture).__webglTexture||T.depthTexture.image.width!==T.width||T.depthTexture.image.height!==T.height)&&(T.depthTexture.image.width=T.width,T.depthTexture.image.height=T.height,T.depthTexture.needsUpdate=!0),F(T.depthTexture,0);const Q=n.get(T.depthTexture).__webglTexture,it=Xt(T);if(T.depthTexture.format===gs)Yt(T)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0,it):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0);else if(T.depthTexture.format===Ts)Yt(T)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0,it):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function st(C){const T=n.get(C),V=C.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==C.depthTexture){const Q=C.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),Q){const it=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,Q.removeEventListener("dispose",it)};Q.addEventListener("dispose",it),T.__depthDisposeCallback=it}T.__boundDepthTexture=Q}if(C.depthTexture&&!T.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");J(T.__webglFramebuffer,C)}else if(V){T.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(e.bindFramebuffer(r.FRAMEBUFFER,T.__webglFramebuffer[Q]),T.__webglDepthbuffer[Q]===void 0)T.__webglDepthbuffer[Q]=r.createRenderbuffer(),rt(T.__webglDepthbuffer[Q],C,!1);else{const it=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,tt=T.__webglDepthbuffer[Q];r.bindRenderbuffer(r.RENDERBUFFER,tt),r.framebufferRenderbuffer(r.FRAMEBUFFER,it,r.RENDERBUFFER,tt)}}else if(e.bindFramebuffer(r.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=r.createRenderbuffer(),rt(T.__webglDepthbuffer,C,!1);else{const Q=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,it=T.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,it),r.framebufferRenderbuffer(r.FRAMEBUFFER,Q,r.RENDERBUFFER,it)}e.bindFramebuffer(r.FRAMEBUFFER,null)}function lt(C,T,V){const Q=n.get(C);T!==void 0&&$(Q.__webglFramebuffer,C,C.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),V!==void 0&&st(C)}function ot(C){const T=C.texture,V=n.get(C),Q=n.get(T);C.addEventListener("dispose",w);const it=C.textures,tt=C.isWebGLCubeRenderTarget===!0,Tt=it.length>1;if(Tt||(Q.__webglTexture===void 0&&(Q.__webglTexture=r.createTexture()),Q.__version=T.version,o.memory.textures++),tt){V.__webglFramebuffer=[];for(let ft=0;ft<6;ft++)if(T.mipmaps&&T.mipmaps.length>0){V.__webglFramebuffer[ft]=[];for(let vt=0;vt<T.mipmaps.length;vt++)V.__webglFramebuffer[ft][vt]=r.createFramebuffer()}else V.__webglFramebuffer[ft]=r.createFramebuffer()}else{if(T.mipmaps&&T.mipmaps.length>0){V.__webglFramebuffer=[];for(let ft=0;ft<T.mipmaps.length;ft++)V.__webglFramebuffer[ft]=r.createFramebuffer()}else V.__webglFramebuffer=r.createFramebuffer();if(Tt)for(let ft=0,vt=it.length;ft<vt;ft++){const Qt=n.get(it[ft]);Qt.__webglTexture===void 0&&(Qt.__webglTexture=r.createTexture(),o.memory.textures++)}if(C.samples>0&&Yt(C)===!1){V.__webglMultisampledFramebuffer=r.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ft=0;ft<it.length;ft++){const vt=it[ft];V.__webglColorRenderbuffer[ft]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,V.__webglColorRenderbuffer[ft]);const Qt=s.convert(vt.format,vt.colorSpace),at=s.convert(vt.type),yt=x(vt.internalFormat,Qt,at,vt.colorSpace,C.isXRRenderTarget===!0),Bt=Xt(C);r.renderbufferStorageMultisample(r.RENDERBUFFER,Bt,yt,C.width,C.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ft,r.RENDERBUFFER,V.__webglColorRenderbuffer[ft])}r.bindRenderbuffer(r.RENDERBUFFER,null),C.depthBuffer&&(V.__webglDepthRenderbuffer=r.createRenderbuffer(),rt(V.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(tt){e.bindTexture(r.TEXTURE_CUBE_MAP,Q.__webglTexture),j(r.TEXTURE_CUBE_MAP,T);for(let ft=0;ft<6;ft++)if(T.mipmaps&&T.mipmaps.length>0)for(let vt=0;vt<T.mipmaps.length;vt++)$(V.__webglFramebuffer[ft][vt],C,T,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ft,vt);else $(V.__webglFramebuffer[ft],C,T,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ft,0);p(T)&&g(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Tt){for(let ft=0,vt=it.length;ft<vt;ft++){const Qt=it[ft],at=n.get(Qt);e.bindTexture(r.TEXTURE_2D,at.__webglTexture),j(r.TEXTURE_2D,Qt),$(V.__webglFramebuffer,C,Qt,r.COLOR_ATTACHMENT0+ft,r.TEXTURE_2D,0),p(Qt)&&g(r.TEXTURE_2D)}e.unbindTexture()}else{let ft=r.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ft=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(ft,Q.__webglTexture),j(ft,T),T.mipmaps&&T.mipmaps.length>0)for(let vt=0;vt<T.mipmaps.length;vt++)$(V.__webglFramebuffer[vt],C,T,r.COLOR_ATTACHMENT0,ft,vt);else $(V.__webglFramebuffer,C,T,r.COLOR_ATTACHMENT0,ft,0);p(T)&&g(ft),e.unbindTexture()}C.depthBuffer&&st(C)}function wt(C){const T=C.textures;for(let V=0,Q=T.length;V<Q;V++){const it=T[V];if(p(it)){const tt=C.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:r.TEXTURE_2D,Tt=n.get(it).__webglTexture;e.bindTexture(tt,Tt),g(tt),e.unbindTexture()}}}const Ct=[],N=[];function Ee(C){if(C.samples>0){if(Yt(C)===!1){const T=C.textures,V=C.width,Q=C.height;let it=r.COLOR_BUFFER_BIT;const tt=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Tt=n.get(C),ft=T.length>1;if(ft)for(let vt=0;vt<T.length;vt++)e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+vt,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+vt,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let vt=0;vt<T.length;vt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(it|=r.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(it|=r.STENCIL_BUFFER_BIT)),ft){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Tt.__webglColorRenderbuffer[vt]);const Qt=n.get(T[vt]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Qt,0)}r.blitFramebuffer(0,0,V,Q,0,0,V,Q,it,r.NEAREST),l===!0&&(Ct.length=0,N.length=0,Ct.push(r.COLOR_ATTACHMENT0+vt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(Ct.push(tt),N.push(tt),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,N)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,Ct))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),ft)for(let vt=0;vt<T.length;vt++){e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+vt,r.RENDERBUFFER,Tt.__webglColorRenderbuffer[vt]);const Qt=n.get(T[vt]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,Tt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+vt,r.TEXTURE_2D,Qt,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const T=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[T])}}}function Xt(C){return Math.min(i.maxSamples,C.samples)}function Yt(C){const T=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function Dt(C){const T=o.render.frame;h.get(C)!==T&&(h.set(C,T),C.update())}function ue(C,T){const V=C.colorSpace,Q=C.format,it=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||V!==ze&&V!==yi&&(ee.getTransfer(V)===ge?(Q!==fn||it!==ci)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),T}function Ot(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=I,this.resetTextureUnits=S,this.setTexture2D=F,this.setTexture2DArray=q,this.setTexture3D=O,this.setTextureCube=z,this.rebindTextures=lt,this.setupRenderTarget=ot,this.updateRenderTargetMipmap=wt,this.updateMultisampleRenderTarget=Ee,this.setupDepthRenderbuffer=st,this.setupFrameBufferTexture=$,this.useMultisampledRTT=Yt}function Gg(r,t){function e(n,i=yi){let s;const o=ee.getTransfer(i);if(n===ci)return r.UNSIGNED_BYTE;if(n===_l)return r.UNSIGNED_SHORT_4_4_4_4;if(n===xl)return r.UNSIGNED_SHORT_5_5_5_1;if(n===Uh)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===Nh)return r.BYTE;if(n===Oh)return r.SHORT;if(n===dr)return r.UNSIGNED_SHORT;if(n===gl)return r.INT;if(n===Wi)return r.UNSIGNED_INT;if(n===Ln)return r.FLOAT;if(n===xr)return r.HALF_FLOAT;if(n===Fh)return r.ALPHA;if(n===Bh)return r.RGB;if(n===fn)return r.RGBA;if(n===zh)return r.LUMINANCE;if(n===Hh)return r.LUMINANCE_ALPHA;if(n===gs)return r.DEPTH_COMPONENT;if(n===Ts)return r.DEPTH_STENCIL;if(n===Ml)return r.RED;if(n===vl)return r.RED_INTEGER;if(n===Gh)return r.RG;if(n===yl)return r.RG_INTEGER;if(n===Sl)return r.RGBA_INTEGER;if(n===no||n===io||n===so||n===ro)if(o===ge)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===no)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===io)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===so)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ro)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===no)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===io)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===so)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ro)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Pa||n===La||n===Ia||n===Da)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Pa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===La)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ia)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Da)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Na||n===Oa||n===Ua)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Na||n===Oa)return o===ge?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Ua)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Fa||n===Ba||n===za||n===Ha||n===Ga||n===ka||n===Va||n===Wa||n===Xa||n===Ya||n===qa||n===Ka||n===ja||n===$a)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Fa)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ba)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===za)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ha)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ga)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ka)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Va)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Wa)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Xa)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ya)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===qa)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ka)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ja)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===$a)return o===ge?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===oo||n===Za||n===Ja)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===oo)return o===ge?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Za)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ja)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===kh||n===Qa||n===tl||n===el)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===oo)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Qa)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===tl)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===el)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Es?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}class kg extends We{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class $t extends he{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Vg={type:"move"};class na{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $t,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $t,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $t,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const _ of t.hand.values()){const p=e.getJointPose(_,n),g=this._getHandJoint(c,_);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,m=.005;c.inputState.pinching&&u>f+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Vg)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new $t;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Wg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Xg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Yg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new Ae,s=t.properties.get(i);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new wi({vertexShader:Wg,fragmentShader:Xg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ht(new Ds(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class qg extends Is{constructor(t,e){super();const n=this;let i=null,s=1,o=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,m=null;const _=new Yg,p=e.getContextAttributes();let g=null,x=null;const M=[],y=[],A=new jt;let w=null;const E=new We;E.layers.enable(1),E.viewport=new se;const L=new We;L.layers.enable(2),L.viewport=new se;const U=[E,L],v=new kg;v.layers.enable(1),v.layers.enable(2);let S=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let $=M[X];return $===void 0&&($=new na,M[X]=$),$.getTargetRaySpace()},this.getControllerGrip=function(X){let $=M[X];return $===void 0&&($=new na,M[X]=$),$.getGripSpace()},this.getHand=function(X){let $=M[X];return $===void 0&&($=new na,M[X]=$),$.getHandSpace()};function D(X){const $=y.indexOf(X.inputSource);if($===-1)return;const rt=M[$];rt!==void 0&&(rt.update(X.inputSource,X.frame,c||o),rt.dispatchEvent({type:X.type,data:X.inputSource}))}function F(){i.removeEventListener("select",D),i.removeEventListener("selectstart",D),i.removeEventListener("selectend",D),i.removeEventListener("squeeze",D),i.removeEventListener("squeezestart",D),i.removeEventListener("squeezeend",D),i.removeEventListener("end",F),i.removeEventListener("inputsourceschange",q);for(let X=0;X<M.length;X++){const $=y[X];$!==null&&(y[X]=null,M[X].disconnect($))}S=null,I=null,_.reset(),t.setRenderTarget(g),f=null,u=null,d=null,i=null,x=null,It.stop(),n.isPresenting=!1,t.setPixelRatio(w),t.setSize(A.width,A.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){s=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(X){if(i=X,i!==null){if(g=t.getRenderTarget(),i.addEventListener("select",D),i.addEventListener("selectstart",D),i.addEventListener("selectend",D),i.addEventListener("squeeze",D),i.addEventListener("squeezestart",D),i.addEventListener("squeezeend",D),i.addEventListener("end",F),i.addEventListener("inputsourceschange",q),p.xrCompatible!==!0&&await e.makeXRCompatible(),w=t.getPixelRatio(),t.getSize(A),i.renderState.layers===void 0){const $={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,e,$),i.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new Xi(f.framebufferWidth,f.framebufferHeight,{format:fn,type:ci,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let $=null,rt=null,J=null;p.depth&&(J=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,$=p.stencil?Ts:gs,rt=p.stencil?Es:Wi);const st={colorFormat:e.RGBA8,depthFormat:J,scaleFactor:s};d=new XRWebGLBinding(i,e),u=d.createProjectionLayer(st),i.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),x=new Xi(u.textureWidth,u.textureHeight,{format:fn,type:ci,depthTexture:new id(u.textureWidth,u.textureHeight,rt,void 0,void 0,void 0,void 0,void 0,void 0,$),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),It.setContext(i),It.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function q(X){for(let $=0;$<X.removed.length;$++){const rt=X.removed[$],J=y.indexOf(rt);J>=0&&(y[J]=null,M[J].disconnect(rt))}for(let $=0;$<X.added.length;$++){const rt=X.added[$];let J=y.indexOf(rt);if(J===-1){for(let lt=0;lt<M.length;lt++)if(lt>=y.length){y.push(rt),J=lt;break}else if(y[lt]===null){y[lt]=rt,J=lt;break}if(J===-1)break}const st=M[J];st&&st.connect(rt)}}const O=new P,z=new P;function G(X,$,rt){O.setFromMatrixPosition($.matrixWorld),z.setFromMatrixPosition(rt.matrixWorld);const J=O.distanceTo(z),st=$.projectionMatrix.elements,lt=rt.projectionMatrix.elements,ot=st[14]/(st[10]-1),wt=st[14]/(st[10]+1),Ct=(st[9]+1)/st[5],N=(st[9]-1)/st[5],Ee=(st[8]-1)/st[0],Xt=(lt[8]+1)/lt[0],Yt=ot*Ee,Dt=ot*Xt,ue=J/(-Ee+Xt),Ot=ue*-Ee;if($.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(Ot),X.translateZ(ue),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),st[10]===-1)X.projectionMatrix.copy($.projectionMatrix),X.projectionMatrixInverse.copy($.projectionMatrixInverse);else{const C=ot+ue,T=wt+ue,V=Yt-Ot,Q=Dt+(J-Ot),it=Ct*wt/T*C,tt=N*wt/T*C;X.projectionMatrix.makePerspective(V,Q,it,tt,C,T),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function et(X,$){$===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices($.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(i===null)return;let $=X.near,rt=X.far;_.texture!==null&&(_.depthNear>0&&($=_.depthNear),_.depthFar>0&&(rt=_.depthFar)),v.near=L.near=E.near=$,v.far=L.far=E.far=rt,(S!==v.near||I!==v.far)&&(i.updateRenderState({depthNear:v.near,depthFar:v.far}),S=v.near,I=v.far);const J=X.parent,st=v.cameras;et(v,J);for(let lt=0;lt<st.length;lt++)et(st[lt],J);st.length===2?G(v,E,L):v.projectionMatrix.copy(E.projectionMatrix),K(X,v,J)};function K(X,$,rt){rt===null?X.matrix.copy($.matrixWorld):(X.matrix.copy(rt.matrixWorld),X.matrix.invert(),X.matrix.multiply($.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy($.projectionMatrix),X.projectionMatrixInverse.copy($.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=As*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(X){l=X,u!==null&&(u.fixedFoveation=X),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=X)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(v)};let j=null;function pt(X,$){if(h=$.getViewerPose(c||o),m=$,h!==null){const rt=h.views;f!==null&&(t.setRenderTargetFramebuffer(x,f.framebuffer),t.setRenderTarget(x));let J=!1;rt.length!==v.cameras.length&&(v.cameras.length=0,J=!0);for(let lt=0;lt<rt.length;lt++){const ot=rt[lt];let wt=null;if(f!==null)wt=f.getViewport(ot);else{const N=d.getViewSubImage(u,ot);wt=N.viewport,lt===0&&(t.setRenderTargetTextures(x,N.colorTexture,u.ignoreDepthValues?void 0:N.depthStencilTexture),t.setRenderTarget(x))}let Ct=U[lt];Ct===void 0&&(Ct=new We,Ct.layers.enable(lt),Ct.viewport=new se,U[lt]=Ct),Ct.matrix.fromArray(ot.transform.matrix),Ct.matrix.decompose(Ct.position,Ct.quaternion,Ct.scale),Ct.projectionMatrix.fromArray(ot.projectionMatrix),Ct.projectionMatrixInverse.copy(Ct.projectionMatrix).invert(),Ct.viewport.set(wt.x,wt.y,wt.width,wt.height),lt===0&&(v.matrix.copy(Ct.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),J===!0&&v.cameras.push(Ct)}const st=i.enabledFeatures;if(st&&st.includes("depth-sensing")){const lt=d.getDepthInformation(rt[0]);lt&&lt.isValid&&lt.texture&&_.init(t,lt,i.renderState)}}for(let rt=0;rt<M.length;rt++){const J=y[rt],st=M[rt];J!==null&&st!==void 0&&st.update(J,$,c||o)}j&&j(X,$),$.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:$}),m=null}const It=new nd;It.setAnimationLoop(pt),this.setAnimationLoop=function(X){j=X},this.dispose=function(){}}}const Di=new Nn,Kg=new Gt;function jg(r,t){function e(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,Qh(r)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function i(p,g,x,M,y){g.isMeshBasicMaterial||g.isMeshLambertMaterial?s(p,g):g.isMeshToonMaterial?(s(p,g),d(p,g)):g.isMeshPhongMaterial?(s(p,g),h(p,g)):g.isMeshStandardMaterial?(s(p,g),u(p,g),g.isMeshPhysicalMaterial&&f(p,g,y)):g.isMeshMatcapMaterial?(s(p,g),m(p,g)):g.isMeshDepthMaterial?s(p,g):g.isMeshDistanceMaterial?(s(p,g),_(p,g)):g.isMeshNormalMaterial?s(p,g):g.isLineBasicMaterial?(o(p,g),g.isLineDashedMaterial&&a(p,g)):g.isPointsMaterial?l(p,g,x,M):g.isSpriteMaterial?c(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function s(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,e(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===tn&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,e(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===tn&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,e(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,e(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);const x=t.get(g),M=x.envMap,y=x.envMapRotation;M&&(p.envMap.value=M,Di.copy(y),Di.x*=-1,Di.y*=-1,Di.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Di.y*=-1,Di.z*=-1),p.envMapRotation.value.setFromMatrix4(Kg.makeRotationFromEuler(Di)),p.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,p.aoMapTransform))}function o(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform))}function a(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function l(p,g,x,M){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*x,p.scale.value=M*.5,g.map&&(p.map.value=g.map,e(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function c(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function h(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function d(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function u(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,x){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===tn&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function _(p,g){const x=t.get(g).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function $g(r,t,e,n){let i={},s={},o=[];const a=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,M){const y=M.program;n.uniformBlockBinding(x,y)}function c(x,M){let y=i[x.id];y===void 0&&(m(x),y=h(x),i[x.id]=y,x.addEventListener("dispose",p));const A=M.program;n.updateUBOMapping(x,A);const w=t.render.frame;s[x.id]!==w&&(u(x),s[x.id]=w)}function h(x){const M=d();x.__bindingPointIndex=M;const y=r.createBuffer(),A=x.__size,w=x.usage;return r.bindBuffer(r.UNIFORM_BUFFER,y),r.bufferData(r.UNIFORM_BUFFER,A,w),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,M,y),y}function d(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){const M=i[x.id],y=x.uniforms,A=x.__cache;r.bindBuffer(r.UNIFORM_BUFFER,M);for(let w=0,E=y.length;w<E;w++){const L=Array.isArray(y[w])?y[w]:[y[w]];for(let U=0,v=L.length;U<v;U++){const S=L[U];if(f(S,w,U,A)===!0){const I=S.__offset,D=Array.isArray(S.value)?S.value:[S.value];let F=0;for(let q=0;q<D.length;q++){const O=D[q],z=_(O);typeof O=="number"||typeof O=="boolean"?(S.__data[0]=O,r.bufferSubData(r.UNIFORM_BUFFER,I+F,S.__data)):O.isMatrix3?(S.__data[0]=O.elements[0],S.__data[1]=O.elements[1],S.__data[2]=O.elements[2],S.__data[3]=0,S.__data[4]=O.elements[3],S.__data[5]=O.elements[4],S.__data[6]=O.elements[5],S.__data[7]=0,S.__data[8]=O.elements[6],S.__data[9]=O.elements[7],S.__data[10]=O.elements[8],S.__data[11]=0):(O.toArray(S.__data,F),F+=z.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,I,S.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(x,M,y,A){const w=x.value,E=M+"_"+y;if(A[E]===void 0)return typeof w=="number"||typeof w=="boolean"?A[E]=w:A[E]=w.clone(),!0;{const L=A[E];if(typeof w=="number"||typeof w=="boolean"){if(L!==w)return A[E]=w,!0}else if(L.equals(w)===!1)return L.copy(w),!0}return!1}function m(x){const M=x.uniforms;let y=0;const A=16;for(let E=0,L=M.length;E<L;E++){const U=Array.isArray(M[E])?M[E]:[M[E]];for(let v=0,S=U.length;v<S;v++){const I=U[v],D=Array.isArray(I.value)?I.value:[I.value];for(let F=0,q=D.length;F<q;F++){const O=D[F],z=_(O),G=y%A,et=G%z.boundary,K=G+et;y+=et,K!==0&&A-K<z.storage&&(y+=A-K),I.__data=new Float32Array(z.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=y,y+=z.storage}}}const w=y%A;return w>0&&(y+=A-w),x.__size=y,x.__cache={},this}function _(x){const M={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(M.boundary=4,M.storage=4):x.isVector2?(M.boundary=8,M.storage=8):x.isVector3||x.isColor?(M.boundary=16,M.storage=12):x.isVector4?(M.boundary=16,M.storage=16):x.isMatrix3?(M.boundary=48,M.storage=48):x.isMatrix4?(M.boundary=64,M.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),M}function p(x){const M=x.target;M.removeEventListener("dispose",p);const y=o.indexOf(M.__bindingPointIndex);o.splice(y,1),r.deleteBuffer(i[M.id]),delete i[M.id],delete s[M.id]}function g(){for(const x in i)r.deleteBuffer(i[x]);o=[],i={},s={}}return{bind:l,update:c,dispose:g}}class Zg{constructor(t={}){const{canvas:e=Fu(),context:n=null,depth:i=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=o;const f=new Uint32Array(4),m=new Int32Array(4);let _=null,p=null;const g=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Be,this.toneMapping=Ai,this.toneMappingExposure=1;const M=this;let y=!1,A=0,w=0,E=null,L=-1,U=null;const v=new se,S=new se;let I=null;const D=new Lt(0);let F=0,q=e.width,O=e.height,z=1,G=null,et=null;const K=new se(0,0,q,O),j=new se(0,0,q,O);let pt=!1;const It=new Al;let X=!1,$=!1;const rt=new Gt,J=new Gt,st=new P,lt=new se,ot={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let wt=!1;function Ct(){return E===null?z:1}let N=n;function Ee(b,H){return e.getContext(b,H)}try{const b={alpha:!0,depth:i,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ml}`),e.addEventListener("webglcontextlost",nt,!1),e.addEventListener("webglcontextrestored",mt,!1),e.addEventListener("webglcontextcreationerror",Mt,!1),N===null){const H="webgl2";if(N=Ee(H,b),N===null)throw Ee(H)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let Xt,Yt,Dt,ue,Ot,C,T,V,Q,it,tt,Tt,ft,vt,Qt,at,yt,Bt,zt,St,Zt,Ht,fe,B;function xt(){Xt=new nm(N),Xt.init(),Ht=new Gg(N,Xt),Yt=new $0(N,Xt,t,Ht),Dt=new Bg(N),Yt.reverseDepthBuffer&&Dt.buffers.depth.setReversed(!0),ue=new rm(N),Ot=new Eg,C=new Hg(N,Xt,Dt,Ot,Yt,Ht,ue),T=new J0(M),V=new em(M),Q=new uf(N),fe=new K0(N,Q),it=new im(N,Q,ue,fe),tt=new am(N,it,Q,ue),zt=new om(N,Yt,C),at=new Z0(Ot),Tt=new Sg(M,T,V,Xt,Yt,fe,at),ft=new jg(M,Ot),vt=new Ag,Qt=new Lg(Xt),Bt=new q0(M,T,V,Dt,tt,u,l),yt=new Ug(M,tt,Yt),B=new $g(N,ue,Yt,Dt),St=new j0(N,Xt,ue),Zt=new sm(N,Xt,ue),ue.programs=Tt.programs,M.capabilities=Yt,M.extensions=Xt,M.properties=Ot,M.renderLists=vt,M.shadowMap=yt,M.state=Dt,M.info=ue}xt();const Z=new qg(M,N);this.xr=Z,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const b=Xt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Xt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(b){b!==void 0&&(z=b,this.setSize(q,O,!1))},this.getSize=function(b){return b.set(q,O)},this.setSize=function(b,H,W=!0){if(Z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=b,O=H,e.width=Math.floor(b*z),e.height=Math.floor(H*z),W===!0&&(e.style.width=b+"px",e.style.height=H+"px"),this.setViewport(0,0,b,H)},this.getDrawingBufferSize=function(b){return b.set(q*z,O*z).floor()},this.setDrawingBufferSize=function(b,H,W){q=b,O=H,z=W,e.width=Math.floor(b*W),e.height=Math.floor(H*W),this.setViewport(0,0,b,H)},this.getCurrentViewport=function(b){return b.copy(v)},this.getViewport=function(b){return b.copy(K)},this.setViewport=function(b,H,W,Y){b.isVector4?K.set(b.x,b.y,b.z,b.w):K.set(b,H,W,Y),Dt.viewport(v.copy(K).multiplyScalar(z).round())},this.getScissor=function(b){return b.copy(j)},this.setScissor=function(b,H,W,Y){b.isVector4?j.set(b.x,b.y,b.z,b.w):j.set(b,H,W,Y),Dt.scissor(S.copy(j).multiplyScalar(z).round())},this.getScissorTest=function(){return pt},this.setScissorTest=function(b){Dt.setScissorTest(pt=b)},this.setOpaqueSort=function(b){G=b},this.setTransparentSort=function(b){et=b},this.getClearColor=function(b){return b.copy(Bt.getClearColor())},this.setClearColor=function(){Bt.setClearColor.apply(Bt,arguments)},this.getClearAlpha=function(){return Bt.getClearAlpha()},this.setClearAlpha=function(){Bt.setClearAlpha.apply(Bt,arguments)},this.clear=function(b=!0,H=!0,W=!0){let Y=0;if(b){let k=!1;if(E!==null){const ct=E.texture.format;k=ct===Sl||ct===yl||ct===vl}if(k){const ct=E.texture.type,gt=ct===ci||ct===Wi||ct===dr||ct===Es||ct===_l||ct===xl,Et=Bt.getClearColor(),At=Bt.getClearAlpha(),Ut=Et.r,Ft=Et.g,bt=Et.b;gt?(f[0]=Ut,f[1]=Ft,f[2]=bt,f[3]=At,N.clearBufferuiv(N.COLOR,0,f)):(m[0]=Ut,m[1]=Ft,m[2]=bt,m[3]=At,N.clearBufferiv(N.COLOR,0,m))}else Y|=N.COLOR_BUFFER_BIT}H&&(Y|=N.DEPTH_BUFFER_BIT,N.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),W&&(Y|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",nt,!1),e.removeEventListener("webglcontextrestored",mt,!1),e.removeEventListener("webglcontextcreationerror",Mt,!1),vt.dispose(),Qt.dispose(),Ot.dispose(),T.dispose(),V.dispose(),tt.dispose(),fe.dispose(),B.dispose(),Tt.dispose(),Z.dispose(),Z.removeEventListener("sessionstart",Vl),Z.removeEventListener("sessionend",Wl),bi.stop()};function nt(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function mt(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;const b=ue.autoReset,H=yt.enabled,W=yt.autoUpdate,Y=yt.needsUpdate,k=yt.type;xt(),ue.autoReset=b,yt.enabled=H,yt.autoUpdate=W,yt.needsUpdate=Y,yt.type=k}function Mt(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Jt(b){const H=b.target;H.removeEventListener("dispose",Jt),ye(H)}function ye(b){$e(b),Ot.remove(b)}function $e(b){const H=Ot.get(b).programs;H!==void 0&&(H.forEach(function(W){Tt.releaseProgram(W)}),b.isShaderMaterial&&Tt.releaseShaderCache(b))}this.renderBufferDirect=function(b,H,W,Y,k,ct){H===null&&(H=ot);const gt=k.isMesh&&k.matrixWorld.determinant()<0,Et=Cd(b,H,W,Y,k);Dt.setMaterial(Y,gt);let At=W.index,Ut=1;if(Y.wireframe===!0){if(At=it.getWireframeAttribute(W),At===void 0)return;Ut=2}const Ft=W.drawRange,bt=W.attributes.position;let ae=Ft.start*Ut,pe=(Ft.start+Ft.count)*Ut;ct!==null&&(ae=Math.max(ae,ct.start*Ut),pe=Math.min(pe,(ct.start+ct.count)*Ut)),At!==null?(ae=Math.max(ae,0),pe=Math.min(pe,At.count)):bt!=null&&(ae=Math.max(ae,0),pe=Math.min(pe,bt.count));const xe=pe-ae;if(xe<0||xe===1/0)return;fe.setup(k,Y,Et,W,At);let en,re=St;if(At!==null&&(en=Q.get(At),re=Zt,re.setIndex(en)),k.isMesh)Y.wireframe===!0?(Dt.setLineWidth(Y.wireframeLinewidth*Ct()),re.setMode(N.LINES)):re.setMode(N.TRIANGLES);else if(k.isLine){let Rt=Y.linewidth;Rt===void 0&&(Rt=1),Dt.setLineWidth(Rt*Ct()),k.isLineSegments?re.setMode(N.LINES):k.isLineLoop?re.setMode(N.LINE_LOOP):re.setMode(N.LINE_STRIP)}else k.isPoints?re.setMode(N.POINTS):k.isSprite&&re.setMode(N.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)re.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(Xt.get("WEBGL_multi_draw"))re.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const Rt=k._multiDrawStarts,Oe=k._multiDrawCounts,oe=k._multiDrawCount,gn=At?Q.get(At).bytesPerElement:1,qi=Ot.get(Y).currentProgram.getUniforms();for(let nn=0;nn<oe;nn++)qi.setValue(N,"_gl_DrawID",nn),re.render(Rt[nn]/gn,Oe[nn])}else if(k.isInstancedMesh)re.renderInstances(ae,xe,k.count);else if(W.isInstancedBufferGeometry){const Rt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Oe=Math.min(W.instanceCount,Rt);re.renderInstances(ae,xe,Oe)}else re.render(ae,xe)};function ne(b,H,W){b.transparent===!0&&b.side===Rn&&b.forceSinglePass===!1?(b.side=tn,b.needsUpdate=!0,Sr(b,H,W),b.side=Vn,b.needsUpdate=!0,Sr(b,H,W),b.side=Rn):Sr(b,H,W)}this.compile=function(b,H,W=null){W===null&&(W=b),p=Qt.get(W),p.init(H),x.push(p),W.traverseVisible(function(k){k.isLight&&k.layers.test(H.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),b!==W&&b.traverseVisible(function(k){k.isLight&&k.layers.test(H.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),p.setupLights();const Y=new Set;return b.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const ct=k.material;if(ct)if(Array.isArray(ct))for(let gt=0;gt<ct.length;gt++){const Et=ct[gt];ne(Et,W,k),Y.add(Et)}else ne(ct,W,k),Y.add(ct)}),x.pop(),p=null,Y},this.compileAsync=function(b,H,W=null){const Y=this.compile(b,H,W);return new Promise(k=>{function ct(){if(Y.forEach(function(gt){Ot.get(gt).currentProgram.isReady()&&Y.delete(gt)}),Y.size===0){k(b);return}setTimeout(ct,10)}Xt.get("KHR_parallel_shader_compile")!==null?ct():setTimeout(ct,10)})};let Ze=null;function Kn(b){Ze&&Ze(b)}function Vl(){bi.stop()}function Wl(){bi.start()}const bi=new nd;bi.setAnimationLoop(Kn),typeof self<"u"&&bi.setContext(self),this.setAnimationLoop=function(b){Ze=b,Z.setAnimationLoop(b),b===null?bi.stop():bi.start()},Z.addEventListener("sessionstart",Vl),Z.addEventListener("sessionend",Wl),this.render=function(b,H){if(H!==void 0&&H.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),Z.enabled===!0&&Z.isPresenting===!0&&(Z.cameraAutoUpdate===!0&&Z.updateCamera(H),H=Z.getCamera()),b.isScene===!0&&b.onBeforeRender(M,b,H,E),p=Qt.get(b,x.length),p.init(H),x.push(p),J.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),It.setFromProjectionMatrix(J),$=this.localClippingEnabled,X=at.init(this.clippingPlanes,$),_=vt.get(b,g.length),_.init(),g.push(_),Z.enabled===!0&&Z.isPresenting===!0){const ct=M.xr.getDepthSensingMesh();ct!==null&&To(ct,H,-1/0,M.sortObjects)}To(b,H,0,M.sortObjects),_.finish(),M.sortObjects===!0&&_.sort(G,et),wt=Z.enabled===!1||Z.isPresenting===!1||Z.hasDepthSensing()===!1,wt&&Bt.addToRenderList(_,b),this.info.render.frame++,X===!0&&at.beginShadows();const W=p.state.shadowsArray;yt.render(W,b,H),X===!0&&at.endShadows(),this.info.autoReset===!0&&this.info.reset();const Y=_.opaque,k=_.transmissive;if(p.setupLights(),H.isArrayCamera){const ct=H.cameras;if(k.length>0)for(let gt=0,Et=ct.length;gt<Et;gt++){const At=ct[gt];Yl(Y,k,b,At)}wt&&Bt.render(b);for(let gt=0,Et=ct.length;gt<Et;gt++){const At=ct[gt];Xl(_,b,At,At.viewport)}}else k.length>0&&Yl(Y,k,b,H),wt&&Bt.render(b),Xl(_,b,H);E!==null&&(C.updateMultisampleRenderTarget(E),C.updateRenderTargetMipmap(E)),b.isScene===!0&&b.onAfterRender(M,b,H),fe.resetDefaultState(),L=-1,U=null,x.pop(),x.length>0?(p=x[x.length-1],X===!0&&at.setGlobalState(M.clippingPlanes,p.state.camera)):p=null,g.pop(),g.length>0?_=g[g.length-1]:_=null};function To(b,H,W,Y){if(b.visible===!1)return;if(b.layers.test(H.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(H);else if(b.isLight)p.pushLight(b),b.castShadow&&p.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||It.intersectsSprite(b)){Y&&lt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(J);const gt=tt.update(b),Et=b.material;Et.visible&&_.push(b,gt,Et,W,lt.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||It.intersectsObject(b))){const gt=tt.update(b),Et=b.material;if(Y&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),lt.copy(b.boundingSphere.center)):(gt.boundingSphere===null&&gt.computeBoundingSphere(),lt.copy(gt.boundingSphere.center)),lt.applyMatrix4(b.matrixWorld).applyMatrix4(J)),Array.isArray(Et)){const At=gt.groups;for(let Ut=0,Ft=At.length;Ut<Ft;Ut++){const bt=At[Ut],ae=Et[bt.materialIndex];ae&&ae.visible&&_.push(b,gt,ae,W,lt.z,bt)}}else Et.visible&&_.push(b,gt,Et,W,lt.z,null)}}const ct=b.children;for(let gt=0,Et=ct.length;gt<Et;gt++)To(ct[gt],H,W,Y)}function Xl(b,H,W,Y){const k=b.opaque,ct=b.transmissive,gt=b.transparent;p.setupLightsView(W),X===!0&&at.setGlobalState(M.clippingPlanes,W),Y&&Dt.viewport(v.copy(Y)),k.length>0&&yr(k,H,W),ct.length>0&&yr(ct,H,W),gt.length>0&&yr(gt,H,W),Dt.buffers.depth.setTest(!0),Dt.buffers.depth.setMask(!0),Dt.buffers.color.setMask(!0),Dt.setPolygonOffset(!1)}function Yl(b,H,W,Y){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Y.id]===void 0&&(p.state.transmissionRenderTarget[Y.id]=new Xi(1,1,{generateMipmaps:!0,type:Xt.has("EXT_color_buffer_half_float")||Xt.has("EXT_color_buffer_float")?xr:ci,minFilter:ai,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ee.workingColorSpace}));const ct=p.state.transmissionRenderTarget[Y.id],gt=Y.viewport||v;ct.setSize(gt.z,gt.w);const Et=M.getRenderTarget();M.setRenderTarget(ct),M.getClearColor(D),F=M.getClearAlpha(),F<1&&M.setClearColor(16777215,.5),M.clear(),wt&&Bt.render(W);const At=M.toneMapping;M.toneMapping=Ai;const Ut=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),p.setupLightsView(Y),X===!0&&at.setGlobalState(M.clippingPlanes,Y),yr(b,W,Y),C.updateMultisampleRenderTarget(ct),C.updateRenderTargetMipmap(ct),Xt.has("WEBGL_multisampled_render_to_texture")===!1){let Ft=!1;for(let bt=0,ae=H.length;bt<ae;bt++){const pe=H[bt],xe=pe.object,en=pe.geometry,re=pe.material,Rt=pe.group;if(re.side===Rn&&xe.layers.test(Y.layers)){const Oe=re.side;re.side=tn,re.needsUpdate=!0,ql(xe,W,Y,en,re,Rt),re.side=Oe,re.needsUpdate=!0,Ft=!0}}Ft===!0&&(C.updateMultisampleRenderTarget(ct),C.updateRenderTargetMipmap(ct))}M.setRenderTarget(Et),M.setClearColor(D,F),Ut!==void 0&&(Y.viewport=Ut),M.toneMapping=At}function yr(b,H,W){const Y=H.isScene===!0?H.overrideMaterial:null;for(let k=0,ct=b.length;k<ct;k++){const gt=b[k],Et=gt.object,At=gt.geometry,Ut=Y===null?gt.material:Y,Ft=gt.group;Et.layers.test(W.layers)&&ql(Et,H,W,At,Ut,Ft)}}function ql(b,H,W,Y,k,ct){b.onBeforeRender(M,H,W,Y,k,ct),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),k.onBeforeRender(M,H,W,Y,b,ct),k.transparent===!0&&k.side===Rn&&k.forceSinglePass===!1?(k.side=tn,k.needsUpdate=!0,M.renderBufferDirect(W,H,Y,k,b,ct),k.side=Vn,k.needsUpdate=!0,M.renderBufferDirect(W,H,Y,k,b,ct),k.side=Rn):M.renderBufferDirect(W,H,Y,k,b,ct),b.onAfterRender(M,H,W,Y,k,ct)}function Sr(b,H,W){H.isScene!==!0&&(H=ot);const Y=Ot.get(b),k=p.state.lights,ct=p.state.shadowsArray,gt=k.state.version,Et=Tt.getParameters(b,k.state,ct,H,W),At=Tt.getProgramCacheKey(Et);let Ut=Y.programs;Y.environment=b.isMeshStandardMaterial?H.environment:null,Y.fog=H.fog,Y.envMap=(b.isMeshStandardMaterial?V:T).get(b.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&b.envMap===null?H.environmentRotation:b.envMapRotation,Ut===void 0&&(b.addEventListener("dispose",Jt),Ut=new Map,Y.programs=Ut);let Ft=Ut.get(At);if(Ft!==void 0){if(Y.currentProgram===Ft&&Y.lightsStateVersion===gt)return jl(b,Et),Ft}else Et.uniforms=Tt.getUniforms(b),b.onBeforeCompile(Et,M),Ft=Tt.acquireProgram(Et,At),Ut.set(At,Ft),Y.uniforms=Et.uniforms;const bt=Y.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(bt.clippingPlanes=at.uniform),jl(b,Et),Y.needsLights=Ld(b),Y.lightsStateVersion=gt,Y.needsLights&&(bt.ambientLightColor.value=k.state.ambient,bt.lightProbe.value=k.state.probe,bt.directionalLights.value=k.state.directional,bt.directionalLightShadows.value=k.state.directionalShadow,bt.spotLights.value=k.state.spot,bt.spotLightShadows.value=k.state.spotShadow,bt.rectAreaLights.value=k.state.rectArea,bt.ltc_1.value=k.state.rectAreaLTC1,bt.ltc_2.value=k.state.rectAreaLTC2,bt.pointLights.value=k.state.point,bt.pointLightShadows.value=k.state.pointShadow,bt.hemisphereLights.value=k.state.hemi,bt.directionalShadowMap.value=k.state.directionalShadowMap,bt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,bt.spotShadowMap.value=k.state.spotShadowMap,bt.spotLightMatrix.value=k.state.spotLightMatrix,bt.spotLightMap.value=k.state.spotLightMap,bt.pointShadowMap.value=k.state.pointShadowMap,bt.pointShadowMatrix.value=k.state.pointShadowMatrix),Y.currentProgram=Ft,Y.uniformsList=null,Ft}function Kl(b){if(b.uniformsList===null){const H=b.currentProgram.getUniforms();b.uniformsList=lo.seqWithValue(H.seq,b.uniforms)}return b.uniformsList}function jl(b,H){const W=Ot.get(b);W.outputColorSpace=H.outputColorSpace,W.batching=H.batching,W.batchingColor=H.batchingColor,W.instancing=H.instancing,W.instancingColor=H.instancingColor,W.instancingMorph=H.instancingMorph,W.skinning=H.skinning,W.morphTargets=H.morphTargets,W.morphNormals=H.morphNormals,W.morphColors=H.morphColors,W.morphTargetsCount=H.morphTargetsCount,W.numClippingPlanes=H.numClippingPlanes,W.numIntersection=H.numClipIntersection,W.vertexAlphas=H.vertexAlphas,W.vertexTangents=H.vertexTangents,W.toneMapping=H.toneMapping}function Cd(b,H,W,Y,k){H.isScene!==!0&&(H=ot),C.resetTextureUnits();const ct=H.fog,gt=Y.isMeshStandardMaterial?H.environment:null,Et=E===null?M.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:ze,At=(Y.isMeshStandardMaterial?V:T).get(Y.envMap||gt),Ut=Y.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ft=!!W.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),bt=!!W.morphAttributes.position,ae=!!W.morphAttributes.normal,pe=!!W.morphAttributes.color;let xe=Ai;Y.toneMapped&&(E===null||E.isXRRenderTarget===!0)&&(xe=M.toneMapping);const en=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,re=en!==void 0?en.length:0,Rt=Ot.get(Y),Oe=p.state.lights;if(X===!0&&($===!0||b!==U)){const cn=b===U&&Y.id===L;at.setState(Y,b,cn)}let oe=!1;Y.version===Rt.__version?(Rt.needsLights&&Rt.lightsStateVersion!==Oe.state.version||Rt.outputColorSpace!==Et||k.isBatchedMesh&&Rt.batching===!1||!k.isBatchedMesh&&Rt.batching===!0||k.isBatchedMesh&&Rt.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&Rt.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&Rt.instancing===!1||!k.isInstancedMesh&&Rt.instancing===!0||k.isSkinnedMesh&&Rt.skinning===!1||!k.isSkinnedMesh&&Rt.skinning===!0||k.isInstancedMesh&&Rt.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Rt.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Rt.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Rt.instancingMorph===!1&&k.morphTexture!==null||Rt.envMap!==At||Y.fog===!0&&Rt.fog!==ct||Rt.numClippingPlanes!==void 0&&(Rt.numClippingPlanes!==at.numPlanes||Rt.numIntersection!==at.numIntersection)||Rt.vertexAlphas!==Ut||Rt.vertexTangents!==Ft||Rt.morphTargets!==bt||Rt.morphNormals!==ae||Rt.morphColors!==pe||Rt.toneMapping!==xe||Rt.morphTargetsCount!==re)&&(oe=!0):(oe=!0,Rt.__version=Y.version);let gn=Rt.currentProgram;oe===!0&&(gn=Sr(Y,H,k));let qi=!1,nn=!1,Ao=!1;const Me=gn.getUniforms(),di=Rt.uniforms;if(Dt.useProgram(gn.program)&&(qi=!0,nn=!0,Ao=!0),Y.id!==L&&(L=Y.id,nn=!0),qi||U!==b){Yt.reverseDepthBuffer?(rt.copy(b.projectionMatrix),zu(rt),Hu(rt),Me.setValue(N,"projectionMatrix",rt)):Me.setValue(N,"projectionMatrix",b.projectionMatrix),Me.setValue(N,"viewMatrix",b.matrixWorldInverse);const cn=Me.map.cameraPosition;cn!==void 0&&cn.setValue(N,st.setFromMatrixPosition(b.matrixWorld)),Yt.logarithmicDepthBuffer&&Me.setValue(N,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Me.setValue(N,"isOrthographic",b.isOrthographicCamera===!0),U!==b&&(U=b,nn=!0,Ao=!0)}if(k.isSkinnedMesh){Me.setOptional(N,k,"bindMatrix"),Me.setOptional(N,k,"bindMatrixInverse");const cn=k.skeleton;cn&&(cn.boneTexture===null&&cn.computeBoneTexture(),Me.setValue(N,"boneTexture",cn.boneTexture,C))}k.isBatchedMesh&&(Me.setOptional(N,k,"batchingTexture"),Me.setValue(N,"batchingTexture",k._matricesTexture,C),Me.setOptional(N,k,"batchingIdTexture"),Me.setValue(N,"batchingIdTexture",k._indirectTexture,C),Me.setOptional(N,k,"batchingColorTexture"),k._colorsTexture!==null&&Me.setValue(N,"batchingColorTexture",k._colorsTexture,C));const wo=W.morphAttributes;if((wo.position!==void 0||wo.normal!==void 0||wo.color!==void 0)&&zt.update(k,W,gn),(nn||Rt.receiveShadow!==k.receiveShadow)&&(Rt.receiveShadow=k.receiveShadow,Me.setValue(N,"receiveShadow",k.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(di.envMap.value=At,di.flipEnvMap.value=At.isCubeTexture&&At.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&H.environment!==null&&(di.envMapIntensity.value=H.environmentIntensity),nn&&(Me.setValue(N,"toneMappingExposure",M.toneMappingExposure),Rt.needsLights&&Pd(di,Ao),ct&&Y.fog===!0&&ft.refreshFogUniforms(di,ct),ft.refreshMaterialUniforms(di,Y,z,O,p.state.transmissionRenderTarget[b.id]),lo.upload(N,Kl(Rt),di,C)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(lo.upload(N,Kl(Rt),di,C),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Me.setValue(N,"center",k.center),Me.setValue(N,"modelViewMatrix",k.modelViewMatrix),Me.setValue(N,"normalMatrix",k.normalMatrix),Me.setValue(N,"modelMatrix",k.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){const cn=Y.uniformsGroups;for(let bo=0,Id=cn.length;bo<Id;bo++){const $l=cn[bo];B.update($l,gn),B.bind($l,gn)}}return gn}function Pd(b,H){b.ambientLightColor.needsUpdate=H,b.lightProbe.needsUpdate=H,b.directionalLights.needsUpdate=H,b.directionalLightShadows.needsUpdate=H,b.pointLights.needsUpdate=H,b.pointLightShadows.needsUpdate=H,b.spotLights.needsUpdate=H,b.spotLightShadows.needsUpdate=H,b.rectAreaLights.needsUpdate=H,b.hemisphereLights.needsUpdate=H}function Ld(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(b,H,W){Ot.get(b.texture).__webglTexture=H,Ot.get(b.depthTexture).__webglTexture=W;const Y=Ot.get(b);Y.__hasExternalTextures=!0,Y.__autoAllocateDepthBuffer=W===void 0,Y.__autoAllocateDepthBuffer||Xt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Y.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,H){const W=Ot.get(b);W.__webglFramebuffer=H,W.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(b,H=0,W=0){E=b,A=H,w=W;let Y=!0,k=null,ct=!1,gt=!1;if(b){const At=Ot.get(b);if(At.__useDefaultFramebuffer!==void 0)Dt.bindFramebuffer(N.FRAMEBUFFER,null),Y=!1;else if(At.__webglFramebuffer===void 0)C.setupRenderTarget(b);else if(At.__hasExternalTextures)C.rebindTextures(b,Ot.get(b.texture).__webglTexture,Ot.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const bt=b.depthTexture;if(At.__boundDepthTexture!==bt){if(bt!==null&&Ot.has(bt)&&(b.width!==bt.image.width||b.height!==bt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(b)}}const Ut=b.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(gt=!0);const Ft=Ot.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ft[H])?k=Ft[H][W]:k=Ft[H],ct=!0):b.samples>0&&C.useMultisampledRTT(b)===!1?k=Ot.get(b).__webglMultisampledFramebuffer:Array.isArray(Ft)?k=Ft[W]:k=Ft,v.copy(b.viewport),S.copy(b.scissor),I=b.scissorTest}else v.copy(K).multiplyScalar(z).floor(),S.copy(j).multiplyScalar(z).floor(),I=pt;if(Dt.bindFramebuffer(N.FRAMEBUFFER,k)&&Y&&Dt.drawBuffers(b,k),Dt.viewport(v),Dt.scissor(S),Dt.setScissorTest(I),ct){const At=Ot.get(b.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+H,At.__webglTexture,W)}else if(gt){const At=Ot.get(b.texture),Ut=H||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,At.__webglTexture,W||0,Ut)}L=-1},this.readRenderTargetPixels=function(b,H,W,Y,k,ct,gt){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Et=Ot.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&gt!==void 0&&(Et=Et[gt]),Et){Dt.bindFramebuffer(N.FRAMEBUFFER,Et);try{const At=b.texture,Ut=At.format,Ft=At.type;if(!Yt.textureFormatReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Yt.textureTypeReadable(Ft)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=b.width-Y&&W>=0&&W<=b.height-k&&N.readPixels(H,W,Y,k,Ht.convert(Ut),Ht.convert(Ft),ct)}finally{const At=E!==null?Ot.get(E).__webglFramebuffer:null;Dt.bindFramebuffer(N.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(b,H,W,Y,k,ct,gt){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Et=Ot.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&gt!==void 0&&(Et=Et[gt]),Et){const At=b.texture,Ut=At.format,Ft=At.type;if(!Yt.textureFormatReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Yt.textureTypeReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(H>=0&&H<=b.width-Y&&W>=0&&W<=b.height-k){Dt.bindFramebuffer(N.FRAMEBUFFER,Et);const bt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,bt),N.bufferData(N.PIXEL_PACK_BUFFER,ct.byteLength,N.STREAM_READ),N.readPixels(H,W,Y,k,Ht.convert(Ut),Ht.convert(Ft),0);const ae=E!==null?Ot.get(E).__webglFramebuffer:null;Dt.bindFramebuffer(N.FRAMEBUFFER,ae);const pe=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Bu(N,pe,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,bt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,ct),N.deleteBuffer(bt),N.deleteSync(pe),ct}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(b,H=null,W=0){b.isTexture!==!0&&(ao("WebGLRenderer: copyFramebufferToTexture function signature has changed."),H=arguments[0]||null,b=arguments[1]);const Y=Math.pow(2,-W),k=Math.floor(b.image.width*Y),ct=Math.floor(b.image.height*Y),gt=H!==null?H.x:0,Et=H!==null?H.y:0;C.setTexture2D(b,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,gt,Et,k,ct),Dt.unbindTexture()},this.copyTextureToTexture=function(b,H,W=null,Y=null,k=0){b.isTexture!==!0&&(ao("WebGLRenderer: copyTextureToTexture function signature has changed."),Y=arguments[0]||null,b=arguments[1],H=arguments[2],k=arguments[3]||0,W=null);let ct,gt,Et,At,Ut,Ft;W!==null?(ct=W.max.x-W.min.x,gt=W.max.y-W.min.y,Et=W.min.x,At=W.min.y):(ct=b.image.width,gt=b.image.height,Et=0,At=0),Y!==null?(Ut=Y.x,Ft=Y.y):(Ut=0,Ft=0);const bt=Ht.convert(H.format),ae=Ht.convert(H.type);C.setTexture2D(H,0),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,H.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,H.unpackAlignment);const pe=N.getParameter(N.UNPACK_ROW_LENGTH),xe=N.getParameter(N.UNPACK_IMAGE_HEIGHT),en=N.getParameter(N.UNPACK_SKIP_PIXELS),re=N.getParameter(N.UNPACK_SKIP_ROWS),Rt=N.getParameter(N.UNPACK_SKIP_IMAGES),Oe=b.isCompressedTexture?b.mipmaps[k]:b.image;N.pixelStorei(N.UNPACK_ROW_LENGTH,Oe.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Oe.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Et),N.pixelStorei(N.UNPACK_SKIP_ROWS,At),b.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,k,Ut,Ft,ct,gt,bt,ae,Oe.data):b.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,k,Ut,Ft,Oe.width,Oe.height,bt,Oe.data):N.texSubImage2D(N.TEXTURE_2D,k,Ut,Ft,ct,gt,bt,ae,Oe),N.pixelStorei(N.UNPACK_ROW_LENGTH,pe),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,xe),N.pixelStorei(N.UNPACK_SKIP_PIXELS,en),N.pixelStorei(N.UNPACK_SKIP_ROWS,re),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Rt),k===0&&H.generateMipmaps&&N.generateMipmap(N.TEXTURE_2D),Dt.unbindTexture()},this.copyTextureToTexture3D=function(b,H,W=null,Y=null,k=0){b.isTexture!==!0&&(ao("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,Y=arguments[1]||null,b=arguments[2],H=arguments[3],k=arguments[4]||0);let ct,gt,Et,At,Ut,Ft,bt,ae,pe;const xe=b.isCompressedTexture?b.mipmaps[k]:b.image;W!==null?(ct=W.max.x-W.min.x,gt=W.max.y-W.min.y,Et=W.max.z-W.min.z,At=W.min.x,Ut=W.min.y,Ft=W.min.z):(ct=xe.width,gt=xe.height,Et=xe.depth,At=0,Ut=0,Ft=0),Y!==null?(bt=Y.x,ae=Y.y,pe=Y.z):(bt=0,ae=0,pe=0);const en=Ht.convert(H.format),re=Ht.convert(H.type);let Rt;if(H.isData3DTexture)C.setTexture3D(H,0),Rt=N.TEXTURE_3D;else if(H.isDataArrayTexture||H.isCompressedArrayTexture)C.setTexture2DArray(H,0),Rt=N.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,H.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,H.unpackAlignment);const Oe=N.getParameter(N.UNPACK_ROW_LENGTH),oe=N.getParameter(N.UNPACK_IMAGE_HEIGHT),gn=N.getParameter(N.UNPACK_SKIP_PIXELS),qi=N.getParameter(N.UNPACK_SKIP_ROWS),nn=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,xe.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,xe.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,At),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ut),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ft),b.isDataTexture||b.isData3DTexture?N.texSubImage3D(Rt,k,bt,ae,pe,ct,gt,Et,en,re,xe.data):H.isCompressedArrayTexture?N.compressedTexSubImage3D(Rt,k,bt,ae,pe,ct,gt,Et,en,xe.data):N.texSubImage3D(Rt,k,bt,ae,pe,ct,gt,Et,en,re,xe),N.pixelStorei(N.UNPACK_ROW_LENGTH,Oe),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,oe),N.pixelStorei(N.UNPACK_SKIP_PIXELS,gn),N.pixelStorei(N.UNPACK_SKIP_ROWS,qi),N.pixelStorei(N.UNPACK_SKIP_IMAGES,nn),k===0&&H.generateMipmaps&&N.generateMipmap(Rt),Dt.unbindTexture()},this.initRenderTarget=function(b){Ot.get(b).__webglFramebuffer===void 0&&C.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?C.setTextureCube(b,0):b.isData3DTexture?C.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?C.setTexture2DArray(b,0):C.setTexture2D(b,0),Dt.unbindTexture()},this.resetState=function(){A=0,w=0,E=null,Dt.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return li}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===El?"display-p3":"srgb",e.unpackColorSpace=ee.workingColorSpace===vo?"display-p3":"srgb"}}class Rl{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Lt(t),this.near=e,this.far=n}clone(){return new Rl(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class ld extends he{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Nn,this.environmentIntensity=1,this.environmentRotation=new Nn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Jg{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=il,this.updateRanges=[],this.version=0,this.uuid=In()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,s=this.stride;i<s;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=In()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=In()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const qe=new P;class Cl{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix4(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyNormalMatrix(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.transformDirection(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Cn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=le(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Cn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Cn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Cn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Cn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),n=le(n,this.array),i=le(i,this.array),s=le(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=s,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return new Te(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Cl(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const jc=new P,$c=new se,Zc=new se,Qg=new P,Jc=new Gt,Vr=new P,ia=new Xn,Qc=new Gt,sa=new yo;class t_ extends ht{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=ec,this.bindMatrix=new Gt,this.bindMatrixInverse=new Gt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new hi),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Vr),this.boundingBox.expandByPoint(Vr)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Xn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Vr),this.boundingSphere.expandByPoint(Vr)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ia.copy(this.boundingSphere),ia.applyMatrix4(i),t.ray.intersectsSphere(ia)!==!1&&(Qc.copy(i).invert(),sa.copy(t.ray).applyMatrix4(Qc),!(this.boundingBox!==null&&sa.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,sa)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new se,e=this.geometry.attributes.skinWeight;for(let n=0,i=e.count;n<i;n++){t.fromBufferAttribute(e,n);const s=1/t.manhattanLength();s!==1/0?t.multiplyScalar(s):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===ec?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===lu?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,i=this.geometry;$c.fromBufferAttribute(i.attributes.skinIndex,t),Zc.fromBufferAttribute(i.attributes.skinWeight,t),jc.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let s=0;s<4;s++){const o=Zc.getComponent(s);if(o!==0){const a=$c.getComponent(s);Jc.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),e.addScaledVector(Qg.copy(jc).applyMatrix4(Jc),o)}}return e.applyMatrix4(this.bindMatrixInverse)}}class cd extends he{constructor(){super(),this.isBone=!0,this.type="Bone"}}class hd extends Ae{constructor(t=null,e=1,n=1,i,s,o,a,l,c=je,h=je,d,u){super(null,o,a,l,c,h,i,s,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const th=new Gt,e_=new Gt;class Pl{constructor(t=[],e=[]){this.uuid=In(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Gt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Gt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let s=0,o=t.length;s<o;s++){const a=t[s]?t[s].matrixWorld:e_;th.multiplyMatrices(a,e[s]),th.toArray(n,s*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new Pl(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new hd(e,t,t,fn,Ln);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const i=this.bones[e];if(i.name===t)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,i=t.bones.length;n<i;n++){const s=t.bones[n];let o=e[s];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),o=new cd),this.bones.push(o),this.boneInverses.push(new Gt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let i=0,s=e.length;i<s;i++){const o=e[i];t.bones.push(o.uuid);const a=n[i];t.boneInverses.push(a.toArray())}return t}}class rl extends Te{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const ls=new Gt,eh=new Gt,Wr=[],nh=new hi,n_=new Gt,Ws=new ht,Xs=new Xn;class dd extends ht{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new rl(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,n_)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new hi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ls),nh.copy(t.boundingBox).applyMatrix4(ls),this.boundingBox.union(nh)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Xn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ls),Xs.copy(t.boundingSphere).applyMatrix4(ls),this.boundingSphere.union(Xs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,o=t*s+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(Ws.geometry=this.geometry,Ws.material=this.material,Ws.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xs.copy(this.boundingSphere),Xs.applyMatrix4(n),t.ray.intersectsSphere(Xs)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,ls),eh.multiplyMatrices(n,ls),Ws.matrixWorld=eh,Ws.raycast(t,Wr);for(let o=0,a=Wr.length;o<a;o++){const l=Wr[o];l.instanceId=s,l.object=this,e.push(l)}Wr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new rl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new hd(new Float32Array(i*this.count),i,this.count,Ml,Ln));const s=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=i*t;s[l]=a,s.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Ll extends kn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Lt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const mo=new P,go=new P,ih=new Gt,Ys=new yo,Xr=new Xn,ra=new P,sh=new P;class mr extends he{constructor(t=new Ye,e=new Ll){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,s=e.count;i<s;i++)mo.fromBufferAttribute(e,i-1),go.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=mo.distanceTo(go);t.setAttribute("lineDistance",new De(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Xr.copy(n.boundingSphere),Xr.applyMatrix4(i),Xr.radius+=s,t.ray.intersectsSphere(Xr)===!1)return;ih.copy(i).invert(),Ys.copy(t.ray).applyMatrix4(ih);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let _=f,p=m-1;_<p;_+=c){const g=h.getX(_),x=h.getX(_+1),M=Yr(this,t,Ys,l,g,x);M&&e.push(M)}if(this.isLineLoop){const _=h.getX(m-1),p=h.getX(f),g=Yr(this,t,Ys,l,_,p);g&&e.push(g)}}else{const f=Math.max(0,o.start),m=Math.min(u.count,o.start+o.count);for(let _=f,p=m-1;_<p;_+=c){const g=Yr(this,t,Ys,l,_,_+1);g&&e.push(g)}if(this.isLineLoop){const _=Yr(this,t,Ys,l,m-1,f);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Yr(r,t,e,n,i,s){const o=r.geometry.attributes.position;if(mo.fromBufferAttribute(o,i),go.fromBufferAttribute(o,s),e.distanceSqToSegment(mo,go,ra,sh)>n)return;ra.applyMatrix4(r.matrixWorld);const l=t.ray.origin.distanceTo(ra);if(!(l<t.near||l>t.far))return{distance:l,point:sh.clone().applyMatrix4(r.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:r}}const rh=new P,oh=new P;class i_ extends mr{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let i=0,s=e.count;i<s;i+=2)rh.fromBufferAttribute(e,i),oh.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+rh.distanceTo(oh);t.setAttribute("lineDistance",new De(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class s_ extends mr{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}}class ud extends kn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Lt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const ah=new Gt,ol=new yo,qr=new Xn,Kr=new P;class r_ extends he{constructor(t=new Ye,e=new ud){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),qr.copy(n.boundingSphere),qr.applyMatrix4(i),qr.radius+=s,t.ray.intersectsSphere(qr)===!1)return;ah.copy(i).invert(),ol.copy(t.ray).applyMatrix4(ah);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,d=n.attributes.position;if(c!==null){const u=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let m=u,_=f;m<_;m++){const p=c.getX(m);Kr.fromBufferAttribute(d,p),lh(Kr,p,l,i,t,e,this)}}else{const u=Math.max(0,o.start),f=Math.min(d.count,o.start+o.count);for(let m=u,_=f;m<_;m++)Kr.fromBufferAttribute(d,m),lh(Kr,m,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function lh(r,t,e,n,i,s,o){const a=ol.distanceSqToPoint(r);if(a<e){const l=new P;ol.closestPointToPoint(r,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class o_ extends Ae{constructor(t,e,n,i,s,o,a,l,c){super(t,e,n,i,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class un extends Ye{constructor(t=1,e=1,n=1,i=32,s=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const h=[],d=[],u=[],f=[];let m=0;const _=[],p=n/2;let g=0;x(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new De(d,3)),this.setAttribute("normal",new De(u,3)),this.setAttribute("uv",new De(f,2));function x(){const y=new P,A=new P;let w=0;const E=(e-t)/n;for(let L=0;L<=s;L++){const U=[],v=L/s,S=v*(e-t)+t;for(let I=0;I<=i;I++){const D=I/i,F=D*l+a,q=Math.sin(F),O=Math.cos(F);A.x=S*q,A.y=-v*n+p,A.z=S*O,d.push(A.x,A.y,A.z),y.set(q,E,O).normalize(),u.push(y.x,y.y,y.z),f.push(D,1-v),U.push(m++)}_.push(U)}for(let L=0;L<i;L++)for(let U=0;U<s;U++){const v=_[U][L],S=_[U+1][L],I=_[U+1][L+1],D=_[U][L+1];t>0&&(h.push(v,S,D),w+=3),e>0&&(h.push(S,I,D),w+=3)}c.addGroup(g,w,0),g+=w}function M(y){const A=m,w=new jt,E=new P;let L=0;const U=y===!0?t:e,v=y===!0?1:-1;for(let I=1;I<=i;I++)d.push(0,p*v,0),u.push(0,v,0),f.push(.5,.5),m++;const S=m;for(let I=0;I<=i;I++){const F=I/i*l+a,q=Math.cos(F),O=Math.sin(F);E.x=U*O,E.y=p*v,E.z=U*q,d.push(E.x,E.y,E.z),u.push(0,v,0),w.x=q*.5+.5,w.y=O*.5*v+.5,f.push(w.x,w.y),m++}for(let I=0;I<i;I++){const D=A+I,F=S+I;y===!0?h.push(F,F+1,D):h.push(F+1,F,D),L+=3}c.addGroup(g,L,y===!0?1:2),g+=L}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new un(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Yi extends Ye{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const h=[],d=new P,u=new P,f=[],m=[],_=[],p=[];for(let g=0;g<=n;g++){const x=[],M=g/n;let y=0;g===0&&o===0?y=.5/e:g===n&&l===Math.PI&&(y=-.5/e);for(let A=0;A<=e;A++){const w=A/e;d.x=-t*Math.cos(i+w*s)*Math.sin(o+M*a),d.y=t*Math.cos(o+M*a),d.z=t*Math.sin(i+w*s)*Math.sin(o+M*a),m.push(d.x,d.y,d.z),u.copy(d).normalize(),_.push(u.x,u.y,u.z),p.push(w+y,1-M),x.push(c++)}h.push(x)}for(let g=0;g<n;g++)for(let x=0;x<e;x++){const M=h[g][x+1],y=h[g][x],A=h[g+1][x],w=h[g+1][x+1];(g!==0||o>0)&&f.push(M,y,w),(g!==n-1||l<Math.PI)&&f.push(y,A,w)}this.setIndex(f),this.setAttribute("position",new De(m,3)),this.setAttribute("normal",new De(_,3)),this.setAttribute("uv",new De(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Yi(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Il extends Ye{constructor(t=1,e=.4,n=12,i=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:s},n=Math.floor(n),i=Math.floor(i);const o=[],a=[],l=[],c=[],h=new P,d=new P,u=new P;for(let f=0;f<=n;f++)for(let m=0;m<=i;m++){const _=m/i*s,p=f/n*Math.PI*2;d.x=(t+e*Math.cos(p))*Math.cos(_),d.y=(t+e*Math.cos(p))*Math.sin(_),d.z=e*Math.sin(p),a.push(d.x,d.y,d.z),h.x=t*Math.cos(_),h.y=t*Math.sin(_),u.subVectors(d,h).normalize(),l.push(u.x,u.y,u.z),c.push(m/i),c.push(f/n)}for(let f=1;f<=n;f++)for(let m=1;m<=i;m++){const _=(i+1)*f+m-1,p=(i+1)*(f-1)+m-1,g=(i+1)*(f-1)+m,x=(i+1)*f+m;o.push(_,p,x),o.push(p,g,x)}this.setIndex(o),this.setAttribute("position",new De(a,3)),this.setAttribute("normal",new De(l,3)),this.setAttribute("uv",new De(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Il(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class _e extends kn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Lt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wh,this.normalScale=new jt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Yn extends _e{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new jt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ve(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Lt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Lt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Lt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}function jr(r,t,e){return!r||!e&&r.constructor===t?r:typeof t.BYTES_PER_ELEMENT=="number"?new t(r):Array.prototype.slice.call(r)}function a_(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function l_(r){function t(i,s){return r[i]-r[s]}const e=r.length,n=new Array(e);for(let i=0;i!==e;++i)n[i]=i;return n.sort(t),n}function ch(r,t,e){const n=r.length,i=new r.constructor(n);for(let s=0,o=0;o!==n;++s){const a=e[s]*t;for(let l=0;l!==t;++l)i[o++]=r[a+l]}return i}function fd(r,t,e,n){let i=1,s=r[0];for(;s!==void 0&&s[n]===void 0;)s=r[i++];if(s===void 0)return;let o=s[n];if(o!==void 0)if(Array.isArray(o))do o=s[n],o!==void 0&&(t.push(s.time),e.push.apply(e,o)),s=r[i++];while(s!==void 0);else if(o.toArray!==void 0)do o=s[n],o!==void 0&&(t.push(s.time),o.toArray(e,e.length)),s=r[i++];while(s!==void 0);else do o=s[n],o!==void 0&&(t.push(s.time),e.push(o)),s=r[i++];while(s!==void 0)}class Mr{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){const e=this.parameterPositions;let n=this._cachedIndex,i=e[n],s=e[n-1];n:{t:{let o;e:{i:if(!(t<i)){for(let a=n+2;;){if(i===void 0){if(t<s)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(s=i,i=e[++n],t<i)break t}o=e.length;break e}if(!(t>=s)){const a=e[1];t<a&&(n=2,s=a);for(let l=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=s,s=e[--n-1],t>=s)break t}o=n,n=0;break e}break n}for(;n<o;){const a=n+o>>>1;t<e[a]?o=a:n=a+1}if(i=e[n],s=e[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i;for(let o=0;o!==i;++o)e[o]=n[s+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class c_ extends Mr{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:nc,endingEnd:nc}}intervalChanged_(t,e,n){const i=this.parameterPositions;let s=t-2,o=t+1,a=i[s],l=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case ic:s=t,a=2*e-n;break;case sc:s=i.length-2,a=e+i[s]-i[s+1];break;default:s=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ic:o=t,l=2*n-e;break;case sc:o=1,l=n+i[1]-i[0];break;default:o=t-1,l=e}const c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=s*h,this._offsetNext=o*h}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,m=(n-e)/(i-e),_=m*m,p=_*m,g=-u*p+2*u*_-u*m,x=(1+u)*p+(-1.5-2*u)*_+(-.5+u)*m+1,M=(-1-f)*p+(1.5+f)*_+.5*m,y=f*p-f*_;for(let A=0;A!==a;++A)s[A]=g*o[h+A]+x*o[c+A]+M*o[l+A]+y*o[d+A];return s}}class h_ extends Mr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(i-e),d=1-h;for(let u=0;u!==a;++u)s[u]=o[c+u]*d+o[l+u]*h;return s}}class d_ extends Mr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}}class qn{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=jr(e,this.TimeBufferType),this.values=jr(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){const e=t.constructor;let n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:jr(t.times,Array),values:jr(t.values,Array)};const i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new d_(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new h_(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new c_(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case ur:e=this.InterpolantFactoryMethodDiscrete;break;case fr:e=this.InterpolantFactoryMethodLinear;break;case Ro:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ur;case this.InterpolantFactoryMethodLinear:return fr;case this.InterpolantFactoryMethodSmooth:return Ro}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t}return this}trim(t,e){const n=this.times,i=n.length;let s=0,o=i-1;for(;s!==i&&n[s]<t;)++s;for(;o!==-1&&n[o]>e;)--o;if(++o,s!==0||o!==i){s>=o&&(o=Math.max(o,1),s=o-1);const a=this.getValueSize();this.times=n.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let t=!0;const e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);const n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==s;a++){const l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(i!==void 0&&a_(i))for(let a=0,l=i.length;a!==l;++a){const c=i[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){const t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Ro,s=t.length-1;let o=1;for(let a=1;a<s;++a){let l=!1;const c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(i)l=!0;else{const d=a*n,u=d-n,f=d+n;for(let m=0;m!==n;++m){const _=e[d+m];if(_!==e[u+m]||_!==e[f+m]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];const d=a*n,u=o*n;for(let f=0;f!==n;++f)e[u+f]=e[d+f]}++o}}if(s>0){t[o]=t[s];for(let a=s*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){const t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,i}}qn.prototype.TimeBufferType=Float32Array;qn.prototype.ValueBufferType=Float32Array;qn.prototype.DefaultInterpolation=fr;class Os extends qn{constructor(t,e,n){super(t,e,n)}}Os.prototype.ValueTypeName="bool";Os.prototype.ValueBufferType=Array;Os.prototype.DefaultInterpolation=ur;Os.prototype.InterpolantFactoryMethodLinear=void 0;Os.prototype.InterpolantFactoryMethodSmooth=void 0;class pd extends qn{}pd.prototype.ValueTypeName="color";class bs extends qn{}bs.prototype.ValueTypeName="number";class u_ extends Mr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(i-e);let c=t*a;for(let h=c+a;c!==h;c+=4)Dn.slerpFlat(s,0,o,c-a,o,c,l);return s}}class Rs extends qn{InterpolantFactoryMethodLinear(t){return new u_(this.times,this.values,this.getValueSize(),t)}}Rs.prototype.ValueTypeName="quaternion";Rs.prototype.InterpolantFactoryMethodSmooth=void 0;class Us extends qn{constructor(t,e,n){super(t,e,n)}}Us.prototype.ValueTypeName="string";Us.prototype.ValueBufferType=Array;Us.prototype.DefaultInterpolation=ur;Us.prototype.InterpolantFactoryMethodLinear=void 0;Us.prototype.InterpolantFactoryMethodSmooth=void 0;class Cs extends qn{}Cs.prototype.ValueTypeName="vector";class f_{constructor(t="",e=-1,n=[],i=cu){this.name=t,this.tracks=n,this.duration=e,this.blendMode=i,this.uuid=In(),this.duration<0&&this.resetDuration()}static parse(t){const e=[],n=t.tracks,i=1/(t.fps||1);for(let o=0,a=n.length;o!==a;++o)e.push(m_(n[o]).scale(i));const s=new this(t.name,t.duration,e,t.blendMode);return s.uuid=t.uuid,s}static toJSON(t){const e=[],n=t.tracks,i={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode};for(let s=0,o=n.length;s!==o;++s)e.push(qn.toJSON(n[s]));return i}static CreateFromMorphTargetSequence(t,e,n,i){const s=e.length,o=[];for(let a=0;a<s;a++){let l=[],c=[];l.push((a+s-1)%s,a,(a+1)%s),c.push(0,1,0);const h=l_(l);l=ch(l,1,h),c=ch(c,1,h),!i&&l[0]===0&&(l.push(s),c.push(c[0])),o.push(new bs(".morphTargetInfluences["+e[a].name+"]",l,c).scale(1/n))}return new this(t,-1,o)}static findByName(t,e){let n=t;if(!Array.isArray(t)){const i=t;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===e)return n[i];return null}static CreateClipsFromMorphTargetSequences(t,e,n){const i={},s=/^([\w-]*?)([\d]+)$/;for(let a=0,l=t.length;a<l;a++){const c=t[a],h=c.name.match(s);if(h&&h.length>1){const d=h[1];let u=i[d];u||(i[d]=u=[]),u.push(c)}}const o=[];for(const a in i)o.push(this.CreateFromMorphTargetSequence(a,i[a],e,n));return o}static parseAnimation(t,e){if(!t)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(d,u,f,m,_){if(f.length!==0){const p=[],g=[];fd(f,p,g,m),p.length!==0&&_.push(new d(u,p,g))}},i=[],s=t.name||"default",o=t.fps||30,a=t.blendMode;let l=t.length||-1;const c=t.hierarchy||[];for(let d=0;d<c.length;d++){const u=c[d].keys;if(!(!u||u.length===0))if(u[0].morphTargets){const f={};let m;for(m=0;m<u.length;m++)if(u[m].morphTargets)for(let _=0;_<u[m].morphTargets.length;_++)f[u[m].morphTargets[_]]=-1;for(const _ in f){const p=[],g=[];for(let x=0;x!==u[m].morphTargets.length;++x){const M=u[m];p.push(M.time),g.push(M.morphTarget===_?1:0)}i.push(new bs(".morphTargetInfluence["+_+"]",p,g))}l=f.length*o}else{const f=".bones["+e[d].name+"]";n(Cs,f+".position",u,"pos",i),n(Rs,f+".quaternion",u,"rot",i),n(Cs,f+".scale",u,"scl",i)}}return i.length===0?null:new this(s,l,i,a)}resetDuration(){const t=this.tracks;let e=0;for(let n=0,i=t.length;n!==i;++n){const s=this.tracks[n];e=Math.max(e,s.times[s.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=!0;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){const t=[];for(let e=0;e<this.tracks.length;e++)t.push(this.tracks[e].clone());return new this.constructor(this.name,this.duration,t,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function p_(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return bs;case"vector":case"vector2":case"vector3":case"vector4":return Cs;case"color":return pd;case"quaternion":return Rs;case"bool":case"boolean":return Os;case"string":return Us}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function m_(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const t=p_(r.type);if(r.times===void 0){const e=[],n=[];fd(r.keys,e,n,"value"),r.times=e,r.values=n}return t.parse!==void 0?t.parse(r):new t(r.name,r.times,r.values,r.interpolation)}const Ei={enabled:!1,files:{},add:function(r,t){this.enabled!==!1&&(this.files[r]=t)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}};class g_{constructor(t,e,n){const i=this;let s=!1,o=0,a=0,l;const c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,s===!1&&i.onStart!==void 0&&i.onStart(h,o,a),s=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){const d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){const f=c[d],m=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null}}}const __=new g_;class Fs{constructor(t){this.manager=t!==void 0?t:__,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){const n=this;return new Promise(function(i,s){n.load(t,i,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}}Fs.DEFAULT_MATERIAL_NAME="__DEFAULT";const ti={};class x_ extends Error{constructor(t,e){super(t),this.response=e}}class md extends Fs{constructor(t){super(t)}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=Ei.get(t);if(s!==void 0)return this.manager.itemStart(t),setTimeout(()=>{e&&e(s),this.manager.itemEnd(t)},0),s;if(ti[t]!==void 0){ti[t].push({onLoad:e,onProgress:n,onError:i});return}ti[t]=[],ti[t].push({onLoad:e,onProgress:n,onError:i});const o=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,l=this.responseType;fetch(o).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=ti[t],d=c.body.getReader(),u=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=u?parseInt(u):0,m=f!==0;let _=0;const p=new ReadableStream({start(g){x();function x(){d.read().then(({done:M,value:y})=>{if(M)g.close();else{_+=y.byteLength;const A=new ProgressEvent("progress",{lengthComputable:m,loaded:_,total:f});for(let w=0,E=h.length;w<E;w++){const L=h[w];L.onProgress&&L.onProgress(A)}g.enqueue(y),x()}},M=>{g.error(M)})}}});return new Response(p)}else throw new x_(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return c.json();default:if(a===void 0)return c.text();{const d=/charset="?([^;"\s]*)"?/i.exec(a),u=d&&d[1]?d[1].toLowerCase():void 0,f=new TextDecoder(u);return c.arrayBuffer().then(m=>f.decode(m))}}}).then(c=>{Ei.add(t,c);const h=ti[t];delete ti[t];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onLoad&&f.onLoad(c)}}).catch(c=>{const h=ti[t];if(h===void 0)throw this.manager.itemError(t),c;delete ti[t];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onError&&f.onError(c)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}}class M_ extends Fs{constructor(t){super(t)}load(t,e,n,i){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=Ei.get(t);if(o!==void 0)return s.manager.itemStart(t),setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0),o;const a=pr("img");function l(){h(),Ei.add(t,this),e&&e(this),s.manager.itemEnd(t)}function c(d){h(),i&&i(d),s.manager.itemError(t),s.manager.itemEnd(t)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),s.manager.itemStart(t),a.src=t,a}}class v_ extends Fs{constructor(t){super(t)}load(t,e,n,i){const s=new Ae,o=new M_(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(t,function(a){s.image=a,s.needsUpdate=!0,e!==void 0&&e(s)},n,i),s}}class vr extends he{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Lt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class gd extends vr{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(he.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Lt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const oa=new Gt,hh=new P,dh=new P;class Dl{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new jt(512,512),this.map=null,this.mapPass=null,this.matrix=new Gt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Al,this._frameExtents=new jt(1,1),this._viewportCount=1,this._viewports=[new se(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;hh.setFromMatrixPosition(t.matrixWorld),e.position.copy(hh),dh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(dh),e.updateMatrixWorld(),oa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(oa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(oa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class y_ extends Dl{constructor(){super(new We(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){const e=this.camera,n=As*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height,s=t.distance||e.far;(n!==e.fov||i!==e.aspect||s!==e.far)&&(e.fov=n,e.aspect=i,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class S_ extends vr{constructor(t,e,n=0,i=Math.PI/3,s=0,o=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(he.DEFAULT_UP),this.updateMatrix(),this.target=new he,this.distance=n,this.angle=i,this.penumbra=s,this.decay=o,this.map=null,this.shadow=new y_}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const uh=new Gt,qs=new P,aa=new P;class E_ extends Dl{constructor(){super(new We(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new jt(4,2),this._viewportCount=6,this._viewports=[new se(2,1,1,1),new se(0,1,1,1),new se(3,1,1,1),new se(1,1,1,1),new se(3,0,1,1),new se(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,i=this.matrix,s=t.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),qs.setFromMatrixPosition(t.matrixWorld),n.position.copy(qs),aa.copy(n.position),aa.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(aa),n.updateMatrixWorld(),i.makeTranslation(-qs.x,-qs.y,-qs.z),uh.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(uh)}}class Nl extends vr{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new E_}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class T_ extends Dl{constructor(){super(new wl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class lr extends vr{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(he.DEFAULT_UP),this.updateMatrix(),this.target=new he,this.shadow=new T_}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class A_ extends vr{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class cr{static decodeText(t){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(t);let e="";for(let n=0,i=t.length;n<i;n++)e+=String.fromCharCode(t[n]);try{return decodeURIComponent(escape(e))}catch{return e}}static extractUrlBase(t){const e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}}class w_ extends Fs{constructor(t){super(t),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(t){return this.options=t,this}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,o=Ei.get(t);if(o!==void 0){if(s.manager.itemStart(t),o.then){o.then(c=>{e&&e(c),s.manager.itemEnd(t)}).catch(c=>{i&&i(c)});return}return setTimeout(function(){e&&e(o),s.manager.itemEnd(t)},0),o}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader;const l=fetch(t,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return Ei.add(t,c),e&&e(c),s.manager.itemEnd(t),c}).catch(function(c){i&&i(c),Ei.remove(t),s.manager.itemError(t),s.manager.itemEnd(t)});Ei.add(t,l),s.manager.itemStart(t)}}const Ol="\\[\\]\\.:\\/",b_=new RegExp("["+Ol+"]","g"),Ul="[^"+Ol+"]",R_="[^"+Ol.replace("\\.","")+"]",C_=/((?:WC+[\/:])*)/.source.replace("WC",Ul),P_=/(WCOD+)?/.source.replace("WCOD",R_),L_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ul),I_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ul),D_=new RegExp("^"+C_+P_+L_+I_+"$"),N_=["material","materials","bones","map"];class O_{constructor(t,e,n){const i=n||ce.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(t,e)}bind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}}class ce{constructor(t,e,n){this.path=e,this.parsedPath=n||ce.parseTrackName(e),this.node=ce.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new ce.Composite(t,e,n):new ce(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(b_,"")}static parseTrackName(t){const e=D_.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);const n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const s=n.nodeName.substring(i+1);N_.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){const n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){const n=function(s){for(let o=0;o<s.length;o++){const a=s[o];if(a.name===e||a.uuid===e)return a;const l=n(a.children);if(l)return l}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node;const e=this.parsedPath,n=e.objectName,i=e.propertyName;let s=e.propertyIndex;if(t||(t=ce.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}const o=t[i];if(o===void 0){const c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}ce.Composite=O_;ce.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ce.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ce.prototype.GetterByBindingType=[ce.prototype._getValue_direct,ce.prototype._getValue_array,ce.prototype._getValue_arrayElement,ce.prototype._getValue_toArray];ce.prototype.SetterByBindingTypeAndVersioning=[[ce.prototype._setValue_direct,ce.prototype._setValue_direct_setNeedsUpdate,ce.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_array,ce.prototype._setValue_array_setNeedsUpdate,ce.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_arrayElement,ce.prototype._setValue_arrayElement_setNeedsUpdate,ce.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_fromArray,ce.prototype._setValue_fromArray_setNeedsUpdate,ce.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ml}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ml);const Bi={TICK_RATE:60,TICK_DT:1/60,MAX_TICKS_PER_FRAME:5},Kt={CAPSULE_RADIUS:.4,HEIGHT_STAND:1.8,HEIGHT_CROUCH:1,EYE_STAND:1.65,EYE_CROUCH:.85,SPEED_WALK:4.4,SPEED_SPRINT:7.2,SPEED_CROUCH:2.1,ADS_MOVE_MULT:.45,ACCEL_GROUND:60,FRICTION_GROUND:10,ACCEL_AIR:12,AIR_CONTROL:.3,GRAVITY:-22,JUMP_IMPULSE:6.2,MAX_STEP_HEIGHT:.45,MAX_SLOPE_DEG:47,COYOTE_TIME:.12,JUMP_BUFFER:.15,CROUCH_LERP:8,SPAWN:{x:140,z:350}},Je={SPEED_MULT:1.35,SPEED_CAP:10.5,FRICTION:6,DURATION:1.1,COOLDOWN:.9,CAMERA_HEIGHT:.75,CAMERA_ROLL_DEG:4,SLOPE_ACCEL:26,UPHILL_DECAY_MULT:2.6,MIN_SPEED:2.6},zi={MIN_HEIGHT:.5,MAX_HEIGHT:1.6,DURATION:.35,REACH:1,CLEARANCE:1.9},Ks={SPEED:3.6,STICK:.88,CENTER_PULL:6},Ue={FOV_BASE:80,FOV_SPRINT:88,FOV_UP_TIME:.18,FOV_DOWN_TIME:.12,SENSITIVITY:.0022,PITCH_CLAMP_DEG:88,NEAR:.05,FAR:2800,BOB_AMP_VERT:.035,BOB_AMP_HORIZ:.025,BOB_FREQ_SCALE:.25,BOB_MAX_INTENSITY:1.2,BOB_ADS_MULT:.3,STRAFE_ROLL_DEG:.6},dt={SEED:1337,SIZE:1800,CELL:4,WATER_LEVEL:0,NOISE_OCTAVES:5,NOISE_BASE_FREQ:.0012,NOISE_LACUNARITY:2.05,NOISE_PERSISTENCE:.48,FALLOFF_START:.9,FALLOFF_END:.995,BASE_LIFT:5,EDGE_DEPTH:22,COAST_X:-560,COAST_BLEND:70,MISSION_BAY_LOBES:[{x:-360,z:-20,rx:150,rz:120,depth:5},{x:-420,z:60,rx:90,rz:70,depth:4.5},{x:-280,z:70,rx:70,rz:55,depth:4}],SD_BAY:{x:-280,z:420,rx:170,rz:240},POINT_LOMA:{x:-420,z:420,rx:95,rz:200,ridge:38},CORONADO:{x:-200,z:520,rx:110,rz:55,height:8},EAST_HILLS:{x:480,z:20,radius:280,peak:95},NORTH_MESA:{x:-80,z:-220,radius:260,peak:52},MISSION_VALLEY:{z:90,halfWidth:95,depth:14},EAST_MOUNTAINS:{spineX:680,spineHalfWidth:260,foothillStart:320,peakMax:180,peakMin:100,peaks:[{x:640,z:-400,peak:172,r:170},{x:700,z:-60,peak:180,r:190},{x:660,z:240,peak:162,r:160},{x:620,z:500,peak:150,r:150}],ridges:[{x:520,z:-220,rx:95,rz:300,peak:118},{x:560,z:160,rx:90,rz:280,peak:128},{x:500,z:20,rx:75,rz:220,peak:105}]},FOG_NEAR:1100,FOG_FAR:2600,SKY_COLOR:11061468,SUN_ELEVATION_DEG:42,SUN_AZIMUTH_DEG:245,SUN_INTENSITY:2.85,SUN_COLOR:16772048,AMBIENT_SKY:11586784,AMBIENT_GROUND:8022608,AMBIENT_INTENSITY:.92,SHADOW_MAP_SIZE:2048,SHADOW_BOX:160},hs={SAND:14733480,GRASS:5931576,DRY_GRASS:11573328,CHAPARRAL:9401664,ROCK:9868432,ROCK_DARK:5591888,SNOW:15791352,ASPHALT:3421496,URBAN:9079950,SAND_MAX:2.8,GRASS_MAX:32,CHAPARRAL_MIN:45,ALPINE_MIN:100,ROCK_MIN_SLOPE_DEG:30,ROCK_DARK_SLOPE_DEG:44,SNOW_MIN:158,NOISE_VARIATION:.015},pn=[{id:"lajolla",name:"La Jolla",x:-480,z:-480,loot:"high",note:"NW coastal cliffs / village (on land)"},{id:"kearnymesa",name:"Kearny Mesa",x:140,z:-380,loot:"medium",note:"North mesa industrial/commercial"},{id:"missionvalley",name:"Mission Valley",x:-20,z:40,loot:"high",note:"I-8 corridor valley floor — spawn hub"},{id:"airport",name:"San Diego International Airport",x:-120,z:100,loot:"medium",note:"SAN hangars on dry apron north of the bay"},{id:"mcrd",name:"MCRD Depot",x:30,z:180,loot:"high",note:"Barracks grid east of the airport"},{id:"downtown",name:"Downtown",x:140,z:360,loot:"highest",note:"Bayfront skyline on land (downtown.png)"},{id:"pointloma",name:"Point Loma",x:-420,z:400,loot:"high",note:"Peninsula ridge (on Point Loma land mass)"},{id:"balboa",name:"Balboa Park",x:240,z:320,loot:"high",note:"Park / museum area NE of downtown"},{id:"zoo",name:"San Diego Zoo",x:360,z:100,loot:"high",note:"Zoo grounds north of Balboa"},{id:"coronado",name:"Coronado",x:-200,z:520,loot:"high",note:"Island land mass across San Diego Bay"},{id:"radiotower",name:"Radio Tower",x:700,z:-60,loot:"high",note:"Summit outpost on eastern mountain spine"}],U_=[["lajolla","kearnymesa"],["lajolla","missionvalley"],["lajolla","airport"],["lajolla","pointloma"],["kearnymesa","missionvalley"],["missionvalley","airport"],["missionvalley","downtown"],["missionvalley","mcrd"],["missionvalley","balboa"],["airport","mcrd"],["airport","downtown"],["mcrd","downtown"],["pointloma","airport"],["pointloma","downtown"],["pointloma","coronado"],["kearnymesa","downtown"],["kearnymesa","zoo"],["downtown","balboa"],["balboa","zoo"],["balboa","missionvalley"],["coronado","downtown"],["coronado","airport"],["radiotower","kearnymesa"],["radiotower","missionvalley"],["radiotower","balboa"],["radiotower","zoo"]],F_=[{id:"i5",width:16,pts:[[-480,-620],[-480,-480],[-360,-200],[-200,40],[-120,100],[20,200],[40,300],[30,420],[40,560]]},{id:"i8",width:16,pts:[[-500,30],[-280,40],[-20,40],[140,50],[300,40],[480,20],[640,0]]},{id:"i15",width:14,pts:[[140,-500],[140,-380],[100,-160],[60,40],[100,200],[200,280],[260,360],[280,460],[260,560]]},{id:"i805",width:14,pts:[[40,-520],[60,-300],[20,-80],[0,40],[20,180],[50,280],[60,360],[80,460],[100,540]]},{id:"sr52",width:12,pts:[[-480,-480],[-280,-420],[0,-400],[140,-380],[320,-300],[500,-200],[640,-80]]},{id:"sr163",width:12,pts:[[140,-380],[160,-200],[180,40],[200,180],[210,260],[180,300],[140,320]]},{id:"harbor",width:12,pts:[[-420,400],[-300,280],[-160,160],[-80,200],[20,300],[40,380],[60,460],[20,500],[-80,520],[-200,520]]}],Hn={WIDTH:12,BLEND:12,RAISE:.12,FREEWAY_BLEND:14,MIN_HEIGHT:2.5},hr={cx:140,cz:360,halfW:185,halfD:165,blend:55,targetY:null,minDry:4,microAmp:.35,maxFootprintDelta:1.25},te={FLOOR_HEIGHT:3.4,GROUND_FLOOR_HEIGHT:4.2,WALL_THICKNESS:.25,SLAB_THICKNESS:.3,GROUND_SLAB_LIFT:.08,DOOR_WIDTH:1.4,DOOR_HEIGHT:2.2,WINDOW_SILL:.9,WINDOW_HEIGHT:1.3,STAIR_WIDTH:1.55,STAIR_STEPS_PER_FLOOR:14,STAIR_THICKNESS:.55,PARAPET_HEIGHT:1,PALETTE:[9078912,8014396,10131084,7035203,8881535,9412776],ROOF_COLOR:4867908,FLOOR_COLOR:10263188},Hi={COUNT:350,MIN_SPACING:7,POI_BIAS:.3,TYPES:{ROCK:{color:7236712,min:[1,.7,1],max:[2.8,2.2,2.8]},CRATE:{color:9337434,min:[1,1,1],max:[1.6,1.6,1.6]},LOW_WALL:{color:8881535,min:[3,1.1,.5],max:[6,1.4,.7]},CONTAINER:{color:4877178,min:[6.06,2.59,2.44],max:[6.06,2.59,2.44]},VEHICLE:{color:6054246,min:[4.6,1.45,1.8],max:[5.7,1.9,2]}}},al={SUBURBAN:110,TRAILER:16,GAS:20,RESTAURANT:28,AUTO:14,FIRE:8,BUSINESS:24,SKY:8,BOAT:16,BILLBOARD:20,VEHICLE:70,ANIMALS:36},gr={CELL_SIZE:8,SOLVER_ITERATIONS:3,GROUND_PROBE:.15,SKIN:.005,MAX_SUBSTEP:.25},fh={KEYS:{forward:["KeyW"],back:["KeyS"],left:["KeyA"],right:["KeyD"],jump:["Space"],sprint:["ShiftLeft","ShiftRight"],crouch:["KeyC","ControlLeft"],interact:["KeyE"],reload:["KeyR"],weapon1:["Digit1"],weapon2:["Digit2"],quickSwap:["KeyQ"],inventory:["Tab"],testRange:["KeyP"],debug:["F3"],map:["KeyM"]}},Gn={BASE_HEALTH:100,RECOIL_RECOVERY_DELAY:.18,RECOIL_RECOVERY_RATE:10,SPREAD_RECOVER:4.2,HITMARKER_TIME:.12,DAMAGE_NUM_LIFE:.7,TRACER_LIFE:.06},de={COUNT:52,HEALTH:100,SPEED:2.7,SPEED_JITTER:.7,SPAWN_MIN:18,SPAWN_MAX:220,WANDER_RADIUS:90,WAYPOINT_REACH:1.4,WAYPOINT_PAUSE:.35,RESPAWN_TIME:8,BUILDING_WAYPOINT_CHANCE:.42,AGGRO_RANGE:58,LOSE_RANGE:78,FIRE_RANGE:52,FIRE_COOLDOWN:.14,FIRE_DAMAGE:9,FIRE_SPREAD_DEG:4.5,AGGRESSIVE_FRACTION:.55,REACTION_TIME:.35,COLORS:[4018740,2899282,4865070,3815998,4870720,2766896,3818816,3028288],RADIUS:.35,HEIGHT:1.8},on={common:{id:"common",color:10132122,label:"Common",dmg:1,reload:1,ads:1,mag:1,weight:40},uncommon:{id:"uncommon",color:5025616,label:"Uncommon",dmg:1.05,reload:.95,ads:.95,mag:1,weight:28},rare:{id:"rare",color:2201331,label:"Rare",dmg:1.1,reload:.9,ads:.9,mag:1.2,weight:18},epic:{id:"epic",color:10233776,label:"Epic",dmg:1.15,reload:.85,ads:.85,mag:1.2,weight:10},legendary:{id:"legendary",color:16761095,label:"Legendary",dmg:1.2,reload:.8,ads:.8,mag:1.35,weight:4}},B_={light:{id:"light",label:"Light",stack:180},heavy:{id:"heavy",label:"Heavy",stack:120},long:{id:"long",label:"Long",stack:30},shell:{id:"shell",label:"Shell",stack:40}},ps={vector7:{id:"vector7",name:"Vector-7",class:"ar",fireMode:"auto",ammo:"heavy",rpm:700,magSize:30,reloadTime:2.3,reloadTimeEmpty:2.9,adsTime:.28,swapTime:.45,damage:24,headMult:1.6,limbMult:.88,falloffStart:45,falloffEnd:130,falloffMinMult:.62,muzzleVelocity:740,dropScale:.5,pellets:1,effectiveRange:95,rangeScatterDeg:.55,spreadHip:4.8,spreadAds:.11,spreadMove:1.5,spreadMax:8.5,spreadPerShot:.32,adsRecoilMult:.42,recoilPattern:[[0,.62],[.03,.65],[-.03,.68],[.04,.7],[-.04,.72],[-.22,.65],[-.32,.62],[-.4,.58],[-.36,.55],[-.25,.52],[-.1,.55],[.14,.58],[.48,.62],[.42,.55],[.28,.52],[.16,.5],[-.12,.52],[.24,.55],[-.28,.5],[.2,.48],[-.18,.48],[.25,.5],[-.22,.48],[.12,.46],[-.14,.47],[.18,.48],[-.2,.46],[.1,.45],[-.12,.45],[.14,.44]],color:4876874,viewModel:{len:.55,thick:.06}},kestrel:{id:"kestrel",name:"Kestrel",class:"ar",fireMode:"auto",ammo:"heavy",rpm:780,magSize:25,reloadTime:2.1,reloadTimeEmpty:2.7,adsTime:.26,swapTime:.42,damage:22,headMult:1.55,limbMult:.88,falloffStart:40,falloffEnd:115,falloffMinMult:.6,muzzleVelocity:720,dropScale:.52,pellets:1,effectiveRange:85,rangeScatterDeg:.65,spreadHip:5,spreadAds:.14,spreadMove:1.6,spreadMax:9,spreadPerShot:.34,adsRecoilMult:.4,recoilPattern:[[0,.55],[.06,.58],[-.05,.6],[.1,.56],[-.12,.54],[.18,.52],[.26,.5],[.22,.48],[-.14,.5],[-.28,.52],[-.22,.48],[.12,.48],[.32,.5],[.18,.46],[-.2,.48],[.14,.45],[-.16,.46],[.22,.48],[-.1,.44],[.16,.45],[-.14,.44],[.18,.45],[-.22,.43],[.12,.43],[-.12,.43]],color:5925514,viewModel:{len:.52,thick:.055}},pike:{id:"pike",name:"Pike SMG",class:"smg",fireMode:"auto",ammo:"light",rpm:950,magSize:32,reloadTime:1.85,reloadTimeEmpty:2.35,adsTime:.18,swapTime:.32,damage:18,headMult:1.4,limbMult:.92,falloffStart:10,falloffEnd:38,falloffMinMult:.22,muzzleVelocity:360,dropScale:1.25,pellets:1,effectiveRange:22,rangeScatterDeg:4.8,spreadHip:1.9,spreadAds:.55,spreadMove:.55,spreadMax:7.5,spreadPerShot:.42,adsRecoilMult:.55,recoilPattern:[[0,.55],[.14,.62],[-.18,.68],[.22,.65],[-.28,.7],[.32,.68],[-.3,.72],[.26,.7],[-.35,.75],[.3,.72],[-.28,.7],[.34,.74],[-.32,.76],[.2,.7],[-.24,.72],[.28,.74],[-.3,.72],[.18,.68],[-.22,.7],[.26,.72],[-.24,.7],[.2,.68],[-.28,.72],[.22,.68],[-.18,.66],[.2,.68],[-.22,.66],[.16,.64],[-.2,.66],[.18,.64],[-.16,.62],[.14,.62]],color:6969930,viewModel:{len:.42,thick:.05}},warden:{id:"warden",name:"Warden",class:"lmg",fireMode:"auto",ammo:"heavy",rpm:520,magSize:75,reloadTime:4.4,reloadTimeEmpty:5.2,adsTime:.42,swapTime:.7,damage:29,headMult:1.45,limbMult:.88,falloffStart:55,falloffEnd:160,falloffMinMult:.66,muzzleVelocity:700,dropScale:.65,pellets:1,effectiveRange:110,rangeScatterDeg:.7,spreadHip:6.2,spreadAds:.26,spreadMove:2.2,spreadMax:10,spreadPerShot:.2,adsRecoilMult:.48,recoilPattern:[[0,.78],[.05,.82],[-.06,.85],[.1,.8],[-.12,.78],[.18,.74],[.26,.7],[.32,.68],[.28,.64],[.16,.62],[-.12,.64],[-.28,.68],[-.34,.65],[-.22,.62],[.12,.63],[.28,.66],[.2,.6],[-.16,.62],[.14,.58],[-.22,.6]],color:3815994,viewModel:{len:.62,thick:.08}},longshot:{id:"longshot",name:"Longshot",class:"sniper",fireMode:"bolt",ammo:"long",rpm:42,magSize:5,reloadTime:3.1,reloadTimeEmpty:3.6,adsTime:.48,swapTime:.72,damage:92,headMult:2.25,limbMult:.72,falloffStart:220,falloffEnd:450,falloffMinMult:.9,muzzleVelocity:860,dropScale:2.2,pellets:1,effectiveRange:320,rangeScatterDeg:.08,spreadHip:14,spreadAds:.018,spreadMove:4.5,spreadMax:16,spreadPerShot:.9,adsRecoilMult:.55,recoilPattern:[[0,3.2],[.18,2.9],[-.14,2.7],[.22,2.6],[-.18,2.5]],color:2767434,viewModel:{len:.72,thick:.05},scopeZoomFov:14,scopeOverlay:!0,hideViewOnAds:!0},marksman:{id:"marksman",name:"Marksman DM",class:"dmr",fireMode:"semi",ammo:"heavy",rpm:280,magSize:15,reloadTime:2.5,reloadTimeEmpty:3,adsTime:.34,swapTime:.52,damage:52,headMult:2,limbMult:.82,falloffStart:90,falloffEnd:220,falloffMinMult:.74,muzzleVelocity:780,dropScale:1.75,pellets:1,effectiveRange:160,rangeScatterDeg:.28,spreadHip:6.5,spreadAds:.05,spreadMove:2,spreadMax:10,spreadPerShot:.38,adsRecoilMult:.4,scopeZoomFov:28,scopeOverlay:!0,hideViewOnAds:!0,recoilPattern:[[0,1.2],[.1,1.15],[-.12,1.1],[.14,1.05],[-.1,1],[.16,.98],[-.14,.95],[.12,.92],[-.16,.94],[.1,.9],[-.12,.9],[.14,.88],[-.1,.86],[.12,.86],[-.12,.84]],color:4872762,viewModel:{len:.6,thick:.05}},breaker:{id:"breaker",name:"Breaker",class:"shotgun",fireMode:"pump",ammo:"shell",rpm:68,magSize:6,reloadTime:.5,reloadTimeEmpty:.5,adsTime:.28,swapTime:.48,damage:13,headMult:1.35,limbMult:1,falloffStart:5,falloffEnd:20,falloffMinMult:.1,muzzleVelocity:330,dropScale:1.5,pellets:9,effectiveRange:12,rangeScatterDeg:2.5,spreadHip:7,spreadAds:3.8,spreadMove:1.3,spreadMax:11,spreadPerShot:.5,adsRecoilMult:.7,recoilPattern:[[0,3.8],[.35,3.4],[-.3,3.2],[.25,3],[-.32,2.9],[.18,2.8]],color:5914672,viewModel:{len:.48,thick:.07}},sidearm:{id:"sidearm",name:"Sidearm P9",class:"pistol",fireMode:"semi",ammo:"light",rpm:420,magSize:15,reloadTime:1.55,reloadTimeEmpty:1.95,adsTime:.16,swapTime:.28,damage:24,headMult:1.75,limbMult:.88,falloffStart:12,falloffEnd:42,falloffMinMult:.3,muzzleVelocity:370,dropScale:1.15,pellets:1,effectiveRange:28,rangeScatterDeg:1.8,spreadHip:2.2,spreadAds:.16,spreadMove:.85,spreadMax:5,spreadPerShot:.28,adsRecoilMult:.5,recoilPattern:[[0,.95],[.12,.9],[-.14,.85],[.16,.82],[-.12,.8],[.14,.76],[-.16,.74],[.1,.72],[-.12,.7],[.12,.68],[-.1,.68],[.14,.66],[-.12,.65],[.1,.64],[-.1,.64]],color:2763306,viewModel:{len:.22,thick:.04}}},vn={CLASS_WEIGHTS:{weapon:38,ammo:36,armor:12,heal:14},WEAPON_SPAWN_WEIGHTS:{vector7:10,kestrel:9,pike:12,warden:5,longshot:18,marksman:11,breaker:9,sidearm:14},AMMO_PICKUPS:{light:{amount:30},heavy:{amount:24},long:{amount:8},shell:{amount:8}},OUTDOOR_SPAWN_CHANCE:.35,OUTDOOR_PER_POI:6,OUTDOOR_DOWNTOWN_EXTRA:8,OUTDOOR_SCATTER:28},ei={PER_FLOOR_CHANCE:.6,GUARANTEE_GROUND:!0,MIN_ITEMS:3,MAX_ITEMS:4,MAX_PER_FLOOR:1,MAX_PER_BUILDING:5,MIN_SEPARATION:3},Pe={MINIMAP_SIZE:168,MINIMAP_RANGE:280,FULL_MAP_MAX:720,ZOOM_MIN:1,ZOOM_MAX:14,ZOOM_DEFAULT:1,ZOOM_WHEEL:.15,RASTER:512,POI:"#f0c14a",POI_TEXT:"#e8ecf0",PLAYER:"#7fd4ff",PLAYER_RING:"rgba(127, 212, 255, 0.35)",BORDER:"rgba(255, 255, 255, 0.18)"};class z_{constructor(){this.listeners=new Map}on(t,e){return this.listeners.has(t)||this.listeners.set(t,new Set),this.listeners.get(t).add(e),()=>this.off(t,e)}once(t,e){const n=i=>{this.off(t,n),e(i)};return this.on(t,n)}off(t,e){const n=this.listeners.get(t);n&&n.delete(e)}emit(t,e){const n=this.listeners.get(t);if(n)for(const i of[...n])i(e)}clear(){this.listeners.clear()}}class H_{constructor(){this.accumulator=0,this.last=performance.now()/1e3,this.alpha=0,this.frameDelta=0,this.elapsed=0,this.tickCount=0}advance(t){const e=performance.now()/1e3;let n=e-this.last;this.last=e,n>.25&&(n=.25),this.frameDelta=n,this.elapsed+=n,this.accumulator+=n;let i=0;for(;this.accumulator>=Bi.TICK_DT&&i<Bi.MAX_TICKS_PER_FRAME;)t(Bi.TICK_DT),this.accumulator-=Bi.TICK_DT,i++,this.tickCount++;return i>=Bi.MAX_TICKS_PER_FRAME&&(this.accumulator=0),this.alpha=this.accumulator/Bi.TICK_DT,i}}class G_{constructor(t,e){this.dom=t,this.bus=e,this.keys=new Set,this.mouseDX=0,this.mouseDY=0,this.locked=!1,this.buttons=new Set,this.pressed=new Set,this._bind()}_bind(){window.addEventListener("keydown",t=>{t.repeat||(this.keys.add(t.code),this.pressed.add(t.code),(t.code==="Space"||t.code==="F3"||t.code==="KeyM"||t.code==="Tab")&&t.preventDefault())}),window.addEventListener("keyup",t=>this.keys.delete(t.code)),window.addEventListener("blur",()=>{this.keys.clear(),this.buttons.clear()}),window.addEventListener("click",t=>{var e,n;(n=(e=t.target)==null?void 0:e.closest)!=null&&n.call(e,"#fullmap")||this.requestLock()}),document.addEventListener("pointerlockchange",()=>{this.locked=document.pointerLockElement===this.dom,this.bus.emit("pointerlock",this.locked),this.locked||this.keys.clear()}),document.addEventListener("mousemove",t=>{this.locked&&(this.mouseDX+=t.movementX,this.mouseDY+=t.movementY)}),this.dom.addEventListener("mousedown",t=>this.buttons.add(t.button)),window.addEventListener("mouseup",t=>this.buttons.delete(t.button)),this.dom.addEventListener("contextmenu",t=>t.preventDefault())}requestLock(){if(!this.locked)try{const t=this.dom.requestPointerLock();t&&typeof t.catch=="function"&&t.catch(e=>this.bus.emit("pointerlock:error",e))}catch(t){this.bus.emit("pointerlock:error",t)}}action(t){const e=fh.KEYS[t];if(!e)return!1;for(const n of e)if(this.keys.has(n))return!0;return!1}actionPressed(t){const e=fh.KEYS[t];if(!e)return!1;for(const n of e)if(this.pressed.has(n))return this.pressed.delete(n),!0;return!1}consumeMouse(){const t=this.mouseDX,e=this.mouseDY;return this.mouseDX=0,this.mouseDY=0,{dx:t,dy:e}}endTick(){this.pressed.clear()}}function _r(r){let t=r>>>0;return function(){t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const k_=.5*(Math.sqrt(3)-1),js=(3-Math.sqrt(3))/6,la=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];class ca{constructor(t=0){const e=_r(t),n=new Uint8Array(256);for(let i=0;i<256;i++)n[i]=i;for(let i=255;i>0;i--){const s=Math.floor(e()*(i+1)),o=n[i];n[i]=n[s],n[s]=o}this.perm=new Uint8Array(512),this.permMod8=new Uint8Array(512);for(let i=0;i<512;i++)this.perm[i]=n[i&255],this.permMod8[i]=this.perm[i]%8}noise2D(t,e){const n=(t+e)*k_,i=Math.floor(t+n),s=Math.floor(e+n),o=(i+s)*js,a=t-(i-o),l=e-(s-o);let c,h;a>l?(c=1,h=0):(c=0,h=1);const d=a-c+js,u=l-h+js,f=a-1+2*js,m=l-1+2*js,_=i&255,p=s&255;let g=0,x=0,M=0,y=.5-a*a-l*l;if(y>=0){const E=la[this.permMod8[_+this.perm[p]]];y*=y,g=y*y*(E[0]*a+E[1]*l)}let A=.5-d*d-u*u;if(A>=0){const E=la[this.permMod8[_+c+this.perm[p+h]]];A*=A,x=A*A*(E[0]*d+E[1]*u)}let w=.5-f*f-m*m;if(w>=0){const E=la[this.permMod8[_+1+this.perm[p+1]]];w*=w,M=w*w*(E[0]*f+E[1]*m)}return 70*(g+x+M)}fbm(t,e,n,i,s,o){let a=1,l=i,c=0,h=0;for(let d=0;d<n;d++)c+=this.noise2D(t*l,e*l)*a,h+=a,a*=o,l*=s;return h>0?c/h:0}}function Nt(r,t,e){const n=Math.min(1,Math.max(0,(e-r)/(t-r)));return n*n*(3-2*n)}function Qe(r,t,e){return r<t?t:r>e?e:r}function ie(r,t,e){return r+(t-r)*e}const _d=2.5;function V_(r,t){let e=0;const n=[];for(let o=0;o<r.length-1;o++){const a=Math.hypot(r[o+1][0]-r[o][0],r[o+1][1]-r[o][1]);n.push(a),e+=a}if(e<.001)return{x:r[0][0],z:r[0][1],ux:1,uz:0,px:0,pz:1};let i=W_(t)*e;for(let o=0;o<n.length;o++){if(i<=n[o]||o===n.length-1){const a=r[o],l=r[o+1],c=n[o]>1e-6?i/n[o]:0,h=l[0]-a[0],d=l[1]-a[1],u=n[o]||1,f=h/u,m=d/u;return{x:a[0]+h*c,z:a[1]+d*c,ux:f,uz:m,px:-m,pz:f}}i-=n[o]}const s=r[r.length-1];return{x:s[0],z:s[1],ux:1,uz:0,px:0,pz:1}}function W_(r){return r<0?0:r>1?1:r}function ph(r,t,e,n,i,s,o=5){const a=[];for(let l=0;l<=o;l++){const c=l/o,h=1-c;a.push({x:h*h*r+2*h*c*e+c*c*i,z:h*h*t+2*h*c*n+c*c*s})}return a}function Fl(r=null,t=null){const n=Object.fromEntries(pn.map(o=>[o.id,o])).downtown,i=r??(n==null?void 0:n.x)??140,s=t??(n==null?void 0:n.z)??360;return{cx:i,cz:s,cols:6,rows:5,streetW:12,blockW:32,blockD:30}}function X_(r,t){const e=Fl(r,t),n=e.blockW+e.streetW,i=e.blockD+e.streetW,s=e.cx-(e.cols*n-e.streetW)/2,o=e.cz-(e.rows*i-e.streetW)/2,a=[];for(let c=0;c<=e.cols;c++){const h=s+c*n-e.streetW/2,d=o-e.streetW/2,u=o+e.rows*i-e.streetW/2;a.push({id:`dt-ns-${c}`,width:e.streetW,blend:5,kind:"street",pts:[{x:h,z:d},{x:h,z:u}]})}for(let c=0;c<=e.rows;c++){const h=o+c*i-e.streetW/2,d=s-e.streetW/2,u=s+e.cols*n-e.streetW/2;a.push({id:`dt-ew-${c}`,width:e.streetW,blend:5,kind:"street",pts:[{x:d,z:h},{x:u,z:h}]})}const l=[[1,1],[3,2],[2,3]];for(const[c,h]of l){const d=s+c*n,u=o+h*i;a.push({id:`dt-alley-${h}-${c}`,width:5,blend:3,kind:"alley",pts:[{x:d+e.blockW/2,z:u+2},{x:d+e.blockW/2,z:u+e.blockD-2}]})}return a}function Y_(){const r=Object.fromEntries(pn.map(n=>[n.id,n])),t=[];for(const n of F_)if(t.push({id:n.id,width:n.width??Hn.WIDTH,blend:Hn.FREEWAY_BLEND,pts:n.pts.map(([i,s])=>({x:i,z:s})),kind:"freeway"}),n.pts.length>=3&&(n.width??14)>=12){const i=Math.min(4,Math.floor((n.pts.length-1)/2));for(let s=0;s<i;s++){const o=(s+1)/(i+1),a=V_(n.pts,o),l=s%2===0?1:-1,c=a.px*l,h=a.pz*l;t.push({id:`${n.id}-exit-${s}`,width:8,blend:12,kind:"ramp",pts:ph(a.x-a.ux*20,a.z-a.uz*20,a.x+c*18+a.ux*8,a.z+h*18+a.uz*8,a.x+c*48+a.ux*55,a.z+h*48+a.uz*55,6)}),t.push({id:`${n.id}-ent-${s}`,width:8,blend:12,kind:"ramp",pts:ph(a.x+c*50-a.ux*40,a.z+h*50-a.uz*40,a.x+c*28+a.ux*5,a.z+h*28+a.uz*5,a.x+a.ux*25,a.z+a.uz*25,6)})}}for(const[n,i]of U_){const s=r[n],o=r[i];if(!s||!o)continue;const a=o.x-s.x,l=o.z-s.z,c=Math.hypot(a,l),h=[{x:s.x,z:s.z}];if(c>120){const d=-l/c,u=a/c,f=(s.x+o.x)/2,m=(s.z+o.z)/2,_=f<40?1:f>200?-.4:.2,p=Math.min(70,c*.12);c>280?(h.push({x:s.x+a*.33+d*p*_*.7,z:s.z+l*.33+u*p*_*.7}),h.push({x:s.x+a*.66-d*p*_*.5,z:s.z+l*.66-u*p*_*.5})):h.push({x:f+d*p*_,z:m+u*p*_})}h.push({x:o.x,z:o.z}),t.push({id:`link-${n}-${i}`,width:Hn.WIDTH,blend:Hn.BLEND,kind:"arterial",pts:h})}const e=r.downtown;return e&&t.push({id:"downtown-ring",width:14,blend:10,kind:"arterial",pts:[{x:e.x-160,z:e.z-140},{x:e.x+160,z:e.z-140},{x:e.x+160,z:e.z+140},{x:e.x-160,z:e.z+140},{x:e.x-160,z:e.z-140}]}),t.push(...X_()),t}function q_(r){const t=[];for(const e of r)for(let n=0;n<e.pts.length-1;n++){const i=e.pts[n],s=e.pts[n+1];t.push({a:{x:i.x,z:i.z},b:{x:s.x,z:s.z},width:e.width,blend:e.blend,kind:e.kind})}return t}function K_(r,t){let e=0;for(const n of t){const i=n.kind==="street"||n.kind==="alley"?1.2:n.kind==="ramp"?2:n.kind==="arterial"?2.5:3.5,s=(n.width??Hn.WIDTH)*.5+i,o=n.kind==="street"||n.kind==="alley"?10:12;for(let a=0;a<n.pts.length-1;a++){const l=n.pts[a],c=n.pts[a+1],h=c.x-l.x,d=c.z-l.z,u=Math.hypot(h,d);if(u<1)continue;const f=Math.ceil(u/o);for(let m=0;m<f;m++){const _=(m+.5)/f,p=l.x+h*_,g=l.z+d*_,x=s*2;r.claim(p-s,g-s,x,x,0,!0),e++}}}return e}function $s(r,t,e,n){return{x:r-e/2,z:t-n/2,w:e,d:n}}function j_(r,t){let e=0;const n=Hn.MIN_HEIGHT;for(const i of t){const s=i.x,o=i.z,a=i.x+i.w,l=i.z+i.d;let c=0,h=0;for(let p=o;p<=l;p+=r.cell)for(let g=s;g<=a;g+=r.cell){const x=r.heightAt(g,p);x>=n&&(c+=x,h++)}if(h<4)continue;const d=Math.max(n,c/h),u=Math.max(0,Math.floor((s+r.half)/r.cell)),f=Math.min(r.n-1,Math.ceil((a+r.half)/r.cell)),m=Math.max(0,Math.floor((o+r.half)/r.cell)),_=Math.min(r.n-1,Math.ceil((l+r.half)/r.cell));for(let p=m;p<=_;p++)for(let g=u;g<=f;g++){const x=r.idx(g,p);r.heights[x]=d,r.roadMask[x]=1}e++}return e}function $_(){const r=Object.fromEntries(pn.map(l=>[l.id,l])),t=[],e=(l,c,h,d,u)=>{const f=r[l];f&&t.push($s(f.x+c,f.z+h,d,u))};e("downtown",-95,45,55,42),e("downtown",105,-55,48,58),e("downtown",85,95,58,42),e("downtown",-70,-80,45,40),e("downtown",40,130,50,35),e("airport",40,-40,80,45),e("airport",-30,50,60,40),e("kearnymesa",50,30,55,45),e("kearnymesa",-60,-20,50,40),e("missionvalley",70,-30,70,50),e("missionvalley",-80,20,55,40),e("balboa",40,50,40,35),e("zoo",-30,40,45,40),e("mcrd",50,40,40,35),e("coronado",40,-25,50,35),e("lajolla",30,25,40,32);const n=Fl();t.push($s(n.cx-175,n.cz,48,55)),t.push($s(n.cx+175,n.cz-20,50,48)),t.push($s(n.cx+40,n.cz+165,60,40)),t.push($s(n.cx-50,n.cz-165,55,38));const i=n.blockW+n.streetW,s=n.blockD+n.streetW,o=n.cx-(n.cols*i-n.streetW)/2,a=n.cz-(n.rows*s-n.streetW)/2;for(const[l,c]of[[0,0],[5,4]])t.push({x:o+l*i+3,z:a+c*s+3,w:n.blockW-6,d:n.blockD-6});return t}function Z_(r,t,e,n,i,s=null){let o=0;for(const a of e){const l=t.heightAt(a.x+a.w/2,a.z+a.d/2);if(l<_d)continue;const c=l+.02,h=.35,d=.22;r.addSpan(a.x,c,a.z,a.x+a.w,c+d,a.z+h,11579048,"thin"),r.addSpan(a.x,c,a.z+a.d-h,a.x+a.w,c+d,a.z+a.d,11579048,"thin"),r.addSpan(a.x,c,a.z,a.x+h,c+d,a.z+a.d,11579048,"thin"),r.addSpan(a.x+a.w-h,c,a.z,a.x+a.w,c+d,a.z+a.d,11579048,"thin");const u=3,f=5.5,m=Math.min(12,Math.floor((a.w-2)/u)),_=Math.min(6,Math.floor((a.d-2)/(f+1.5)));let p=0;for(let g=0;g<_;g++)for(let x=0;x<m;x++){const M=a.x+1.2+x*u,y=a.z+1.2+g*(f+1.5);if(r.addSpan(M,c+.01,y,M+.08,c+.04,y+f,15263456,"thin"),!i||p>=8||n()<=.62)continue;const A=4.8,w=2.2;s&&s.blocked(M,y,M+A,y+w)||(i(r,M+.25,y+.4,c,n),s&&s.claim(M,y,A,w,.5),p++)}o++}return o}function J_(r,t,e){if(!r||!t)return 0;const n=Fl(),i=n.blockW+n.streetW,s=n.blockD+n.streetW,o=n.cx-(n.cols*i-n.streetW)/2,a=n.cz-(n.rows*s-n.streetW)/2,l=n.streetW*.5,c=1.65,h=.22,d=.12,u=11579048,f=12894908;let m=0;const _=(p,g,x,M)=>{const y=t.heightAt((p+x)*.5,(g+M)*.5);return Number.isFinite(y)&&y>=_d?y+.02:null};for(let p=0;p<=n.cols;p++){const g=o+p*i-l;for(let x=0;x<n.rows;x++){const M=a+x*s+.4,y=a+x*s+n.blockD-.4;if(!(y<=M+1)){{const A=g-l,w=A-c,E=_(w,M,A,y);E!=null&&(r.addSpan(w,E,M,A,E+.07,y,f,"thin"),r.addSpan(A-h,E,M,A+.02,E+d,y,u,"thin"),m+=2)}{const A=g+l,w=A+c,E=_(A,M,w,y);E!=null&&(r.addSpan(A,E,M,w,E+.07,y,f,"thin"),r.addSpan(A-.02,E,M,A+h,E+d,y,u,"thin"),m+=2)}}}}for(let p=0;p<=n.rows;p++){const g=a+p*s-l;for(let x=0;x<n.cols;x++){const M=o+x*i+.4,y=o+x*i+n.blockW-.4;if(!(y<=M+1)){{const A=g-l,w=A-c,E=_(M,w,y,A);E!=null&&(r.addSpan(M,E,w,y,E+.07,A,f,"thin"),r.addSpan(M,E,A-h,y,E+d,A+.02,u,"thin"),m+=2)}{const A=g+l,w=A+c,E=_(M,A,y,w);E!=null&&(r.addSpan(M,E,A,y,E+.07,w,f,"thin"),r.addSpan(M,E,A-.02,y,E+d,A+h,u,"thin"),m+=2)}}}}return m}class Q_{constructor(t=dt.SEED){this.size=dt.SIZE,this.half=dt.SIZE/2,this.cell=dt.CELL,this.n=Math.round(dt.SIZE/dt.CELL)+1,this.simplex=new ca(t),this.detail=new ca(t+91),this.ridge=new ca(t+203),this.heights=new Float32Array(this.n*this.n),this.roadMask=new Float32Array(this.n*this.n),this.downtownPlateY=null,this._generateBase(),this._applyDowntownPlate(),this.roadLines=Y_(),this.roads=q_(this.roadLines).map(e=>({a:{x:e.a.x,y:e.a.z},b:{x:e.b.x,y:e.b.z},width:e.width,blend:e.blend})),this._applyRoads(),this._reapplyWaterCuts(),this._applyRoads(),this._applyDowntownPlate({reassert:!0}),this._applyRoads({maskOnlyOnPlate:!0}),this.parkingLots=$_(),j_(this,this.parkingLots)}idx(t,e){return e*this.n+t}gx(t){return-this.half+t*this.cell}_ellipse(t,e,n,i,s,o){return((t-n)/s)**2+((e-i)/o)**2}_applyEastMountains(t,e,n,i){const s=dt.EAST_MOUNTAINS;if(!s)return n;const o=Nt(s.foothillStart,s.spineX,t);if(o<.015)return n;const a=s.spineX-t,l=1-Nt(0,s.spineHalfWidth,Math.max(0,a)),c=Nt(s.spineX,s.spineX+140,t);let h=o*Math.max(l,o*.4)*(1-c*.35);const d=this._ridged(t*.85+120,e*1.1,5,.0018,2.15,.52),u=this._ridged(t+200,e-80,3,.0045,2.3,.5);let f=ie(s.peakMin,s.peakMax*.78,d);f+=(u-.5)*28,f+=(i-.5)*12;for(const p of s.peaks){const g=Math.hypot(t-p.x,e-p.z),x=1-Nt(p.r*.2,p.r,g);if(x>0){const M=p.peak*(.72+d*.18+u*.1);f=Math.max(f,ie(f,M,Math.pow(x,1.35))),h=Math.max(h,x*Math.max(o,.75))}}for(const p of s.ridges){const g=this._ellipse(t,e,p.x,p.z,p.rx,p.rz),x=1-Nt(.4,1.12,g);if(x>0){const M=p.peak*(.55+d*.45);f=Math.max(f,ie(f,M,x*x)),h=Math.max(h,x*.9*o)}}const m=Math.pow(1-d,2)*32*h;f-=m*.55;const _=Math.pow(Qe(h,0,1),.95);return ie(n,Math.max(n+8*_,f),_)}_ridged(t,e,n,i,s,o){let a=0,l=.5,c=i,h=0;for(let d=0;d<n;d++){const u=1-Math.abs(this.ridge.noise2D(t*c,e*c)),f=u*u;a+=f*l,h+=l,l*=o,c*=s}return a/Math.max(1e-6,h)}_generateBase(){const{NOISE_OCTAVES:t,NOISE_BASE_FREQ:e,NOISE_LACUNARITY:n,NOISE_PERSISTENCE:i}=dt,s=dt.EAST_HILLS,o=dt.NORTH_MESA,a=dt.MISSION_VALLEY;for(let l=0;l<this.n;l++){const c=this.gx(l);for(let h=0;h<this.n;h++){const d=this.gx(h);let u=this.simplex.fbm(d,c,t,e,n,i);u=u*.5+.5,u=Math.pow(u,1.12);const f=Nt(-350,600,d),m=Nt(160,-420,c);let _=dt.BASE_LIFT+u*18+f*32+m*14;const g=(this._ridged(d,c,4,.0024,2.15,.55)-.45)*28,x=(1-f*.55)*(1-Nt(70,100,_)*.3);_+=g*x;const M=Math.hypot(d-o.x,c-o.z),y=1-Nt(o.radius*.4,o.radius,M);if(y>0){const J=o.peak+this.detail.noise2D(d*.004,c*.004)*6;_=ie(_,J,y*y*.85)}const A=Math.abs(c-a.z),w=1-Nt(a.halfWidth*.55,a.halfWidth,A),E=1-Nt(620,820,Math.abs(d));w>0&&(_-=a.depth*w*E);const L=Math.hypot(d-s.x,c-s.z),U=1-Nt(s.radius*.3,s.radius,L);if(U>0){const J=this._ridged(d+40,c-20,5,.002,2.2,.5),st=s.peak*(.4+J*.6);_=ie(_,st,U*U)}_=this._applyEastMountains(d,c,_,u);const v=1-Nt(0,200,Math.hypot(d- -520,c- -420));_+=v*18;const S=dt.POINT_LOMA,I=this._ellipse(d,c,S.x,S.z,S.rx,S.rz),D=1-Nt(.55,1.15,I);D>0&&(_=Math.max(_,S.ridge*(.7+D*.4)+u*8));let F=_;const q=this.detail.noise2D(c*.0035,3.1)*48;let O=dt.COAST_X+q;if(c>200&&c<620){const J=1-Nt(.4,1.2,this._ellipse(d,c,S.x,S.z,S.rx*1.15,S.rz*1.05));O=ie(O,S.x-S.rx*.9,J*.85)}const z=Nt(O,O-dt.COAST_BLEND,d),G=Nt(560,820,c)*Nt(-100,-500,d);let et=0;for(const J of dt.MISSION_BAY_LOBES){const st=this._ellipse(d,c,J.x,J.z,J.rx,J.rz);et=Math.max(et,1-Nt(.72,1.18,st))}const K=this._ellipse(d,c,dt.SD_BAY.x,dt.SD_BAY.z,dt.SD_BAY.rx,dt.SD_BAY.rz);let j=1-Nt(.68,1.22,K);if(F=ie(F,-dt.MISSION_BAY_LOBES[0].depth,et*.97),F=ie(F,-8,j*.95),F=ie(F,-22,Math.max(z,G*.9)),D>.05){const J=S.ridge*(.55+D*.5)+this.detail.noise2D(d*.006,c*.006)*5;F=ie(F,Math.max(F,J),Math.min(1,D*1.2))}const pt=dt.CORONADO,It=this._ellipse(d,c,pt.x,pt.z,pt.rx,pt.rz),X=1-Nt(.65,1.15,It);if(X>.05){const J=pt.height+this.detail.noise2D(d*.01,c*.01)*2;F=ie(F,Math.max(J,4),Math.min(1,X*1.15))}const $=Math.max(Math.abs(d),Math.abs(c))/this.half,rt=1-Nt(dt.FALLOFF_START,dt.FALLOFF_END,$);F=F*rt-(1-rt)*dt.EDGE_DEPTH,this.heights[this.idx(h,l)]=F}}}_applyDowntownPlate(t={}){const e=hr;if(!e)return;const n=Math.max(0,Math.floor((e.cx-e.halfW-e.blend+this.half)/this.cell)),i=Math.min(this.n-1,Math.ceil((e.cx+e.halfW+e.blend+this.half)/this.cell)),s=Math.max(0,Math.floor((e.cz-e.halfD-e.blend+this.half)/this.cell)),o=Math.min(this.n-1,Math.ceil((e.cz+e.halfD+e.blend+this.half)/this.cell));let a=this.downtownPlateY??e.targetY;if(a==null||!t.reassert){const l=[],c=e.halfW*.7,h=e.halfD*.7;for(let d=s;d<=o;d+=2){const u=this.gx(d);for(let f=n;f<=i;f+=2){const m=this.gx(f);if(Math.abs(m-e.cx)>c||Math.abs(u-e.cz)>h)continue;const _=this.heights[this.idx(f,d)];_>=e.minDry&&l.push(_)}}if(l.length<8)return;l.sort((d,u)=>d-u),a=l[Math.floor(l.length*.62)],a=Math.max(e.minDry+2,a)}this.downtownPlateY=a;for(let l=s;l<=o;l++){const c=this.gx(l);for(let h=n;h<=i;h++){const d=this.gx(h),u=Math.max(0,Math.abs(d-e.cx)-e.halfW)/Math.max(.001,e.blend),f=Math.max(0,Math.abs(c-e.cz)-e.halfD)/Math.max(.001,e.blend),m=Math.max(u,f);if(m>=1)continue;const _=this.idx(h,l),p=this.heights[_];if(p<e.minDry*.45)continue;const g=1-Nt(0,1,m);let x=a;if(m<.15){const y=this.detail.noise2D(d*.02,c*.02);x+=y*e.microAmp}const M=p<x?g:g*.85;this.heights[_]=ie(p,x,M),this.heights[_]<e.minDry&&g>.5&&(this.heights[_]=e.minDry)}}}onDowntownPlate(t,e){const n=hr;return n?Math.abs(t-n.cx)<=n.halfW&&Math.abs(e-n.cz)<=n.halfD:!1}_reapplyWaterCuts(){const t=dt.POINT_LOMA,e=dt.CORONADO;for(let n=0;n<this.n;n++){const i=this.gx(n);for(let s=0;s<this.n;s++){const o=this.gx(s),a=this.idx(s,n),l=1-Nt(.55,1.1,this._ellipse(o,i,t.x,t.z,t.rx,t.rz)),c=1-Nt(.65,1.1,this._ellipse(o,i,e.x,e.z,e.rx,e.rz)),h=this.onDowntownPlate(o,i)?1:0,d=Math.max(l,c,h);if(d>.7)continue;let u=this.heights[a];const f=1-d*.9,m=this.detail.noise2D(i*.0035,3.1)*48;let _=dt.COAST_X+m;if(i>200&&i<620){const w=1-Nt(.4,1.2,this._ellipse(o,i,t.x,t.z,t.rx*1.15,t.rz*1.05));_=ie(_,t.x-t.rx*.9,w*.85)}const p=Nt(_,_-dt.COAST_BLEND,o),g=Nt(560,820,i)*Nt(-100,-500,o);let x=0;for(const w of dt.MISSION_BAY_LOBES){const E=this._ellipse(o,i,w.x,w.z,w.rx,w.rz);x=Math.max(x,1-Nt(.78,1.2,E))}const M=this._ellipse(o,i,dt.SD_BAY.x,dt.SD_BAY.z,dt.SD_BAY.rx,dt.SD_BAY.rz),y=1-Nt(.78,1.25,M);x>.05&&(u=Math.min(u,ie(u,-dt.MISSION_BAY_LOBES[0].depth,x*.98*f))),y>.05&&(u=Math.min(u,ie(u,-8,y*.95*f)));const A=Math.max(p,g*.9);if(A>.05&&(u=Math.min(u,ie(u,-22,A*f))),l>.08){const w=t.ridge*(.55+l*.5);u=Math.max(u,ie(u,w,l))}c>.08&&(u=Math.max(u,ie(u,e.height,c))),this.heights[a]=u}}}_applyRoads(t={}){const e=Hn.MIN_HEIGHT,n=!!t.maskOnlyOnPlate,i=this.downtownPlateY;for(const s of this.roads){const o=(s.width??Hn.WIDTH)/2,a=s.blend??Hn.BLEND,l=o+a,c=s.a.x,h=s.a.y,d=s.b.x,u=s.b.y,f=d-c,m=u-h,_=Math.hypot(f,m);if(_<.001)continue;const p=f/_,g=m/_,x=Math.max(2,Math.ceil(_/this.cell)),M=new Float32Array(x+1);let y=0;for(let S=0;S<=x;S++){const I=S/x,D=this.heightAt(ie(c,d,I),ie(h,u,I));M[S]=Math.max(e,D),D>=e&&y++}if(y<x*.25)continue;const A=new Float32Array(x+1),w=8;for(let S=0;S<=x;S++){let I=0,D=0;for(let F=-w;F<=w;F++){const q=S+F;q<0||q>x||(I+=M[q],D++)}A[S]=Math.max(e,I/D)}const E=Math.max(0,Math.floor((Math.min(c,d)-l+this.half)/this.cell)),L=Math.min(this.n-1,Math.ceil((Math.max(c,d)+l+this.half)/this.cell)),U=Math.max(0,Math.floor((Math.min(h,u)-l+this.half)/this.cell)),v=Math.min(this.n-1,Math.ceil((Math.max(h,u)+l+this.half)/this.cell));for(let S=U;S<=v;S++){const I=this.gx(S);for(let D=E;D<=L;D++){const F=this.gx(D),q=F-c,O=I-h;let z=(q*p+O*g)/_;z=Qe(z,0,1);const G=ie(c,d,z),et=ie(h,u,z),K=Math.hypot(F-G,I-et);if(K>l)continue;let j=A[Math.round(z*x)];const pt=Hn.RAISE,It=K<=o?pt*(1-(K/Math.max(.001,o))**2):0;j=Math.max(e,j+It);const X=1-Nt(o,l,K),$=this.idx(D,S);if(this.heights[$]<e*.5&&X<.9)continue;if(i!=null&&this.onDowntownPlate(F,I)&&n){K<=o?this.roadMask[$]=1:this.roadMask[$]=Math.max(this.roadMask[$],1-Nt(o,o+1.4,K));continue}this.heights[$]=ie(this.heights[$],j,X),this.heights[$]<e&&K<=o&&(this.heights[$]=e),K<=o?this.roadMask[$]=1:this.roadMask[$]=Math.max(this.roadMask[$],1-Nt(o,o+1.6,K))}}}}heightAt(t,e){const n=(t+this.half)/this.cell,i=(e+this.half)/this.cell;let s=Math.floor(n),o=Math.floor(i);s<0?s=0:s>this.n-2&&(s=this.n-2),o<0?o=0:o>this.n-2&&(o=this.n-2);const a=Qe(n-s,0,1),l=Qe(i-o,0,1),c=this.heights[this.idx(s,o)],h=this.heights[this.idx(s+1,o)],d=this.heights[this.idx(s,o+1)],u=this.heights[this.idx(s+1,o+1)];return a+l<=1?c+(h-c)*a+(d-c)*l:u+(d-u)*(1-a)+(h-u)*(1-l)}normalAt(t,e,n=new P){const i=this.cell*.5,s=this.heightAt(t-i,e),o=this.heightAt(t+i,e),a=this.heightAt(t,e-i),l=this.heightAt(t,e+i);return n.set(s-o,2*i,a-l).normalize()}slopeDegAt(t,e){const n=this.normalAt(t,e,tx);return Math.acos(Qe(n.y,-1,1))*180/Math.PI}roadAt(t,e){const n=Math.round((t+this.half)/this.cell),i=Math.round((e+this.half)/this.cell);return n<0||i<0||n>=this.n||i>=this.n?0:this.roadMask[this.idx(n,i)]}_vertexColor(t,e,n,i,s){const o=hs;s.setHex(o.SAND),s.lerp(yn.setHex(o.GRASS),Nt(o.SAND_MAX-.6,o.SAND_MAX+2.2,n)),s.lerp(yn.setHex(o.DRY_GRASS),Nt(o.GRASS_MAX-4,o.GRASS_MAX+4,n)),s.lerp(yn.setHex(o.CHAPARRAL),Nt(o.CHAPARRAL_MIN-4,o.CHAPARRAL_MIN+12,n));const a=Nt(80,420,t)*Nt(20,55,n);s.lerp(yn.setHex(o.CHAPARRAL),a*.28),s.lerp(yn.setHex(o.ROCK),Nt(o.ALPINE_MIN+5,o.ALPINE_MIN+40,n)*.55),s.lerp(yn.setHex(o.ROCK),Nt(o.ROCK_MIN_SLOPE_DEG-4,o.ROCK_MIN_SLOPE_DEG+6,i)),s.lerp(yn.setHex(o.ROCK_DARK),Nt(o.ROCK_DARK_SLOPE_DEG-4,o.ROCK_DARK_SLOPE_DEG+6,i)),s.lerp(yn.setHex(o.ROCK_DARK),Nt(125,150,n)*.5),s.lerp(yn.setHex(o.SNOW),Nt(o.SNOW_MIN-4,o.SNOW_MIN+8,n)*(1-Nt(o.ROCK_MIN_SLOPE_DEG+2,o.ROCK_DARK_SLOPE_DEG+6,i)));const l=(1-Nt(8,16,n))*Nt(-120,100,t)*Nt(100,280,e)*(1-Nt(420,520,e));l>.08&&i<14&&s.lerp(yn.setHex(o.URBAN),l*.28);const c=this.roadAt(t,e);c>0&&s.lerp(yn.setHex(o.ASPHALT),c);const h=1+this.detail.noise2D(t*.003,e*.003)*o.NOISE_VARIATION;return s.setRGB(Qe(s.r*h,0,1),Qe(s.g*h,0,1),Qe(s.b*h,0,1)),s}buildMesh(){const t=this.n,e=t*t,n=new Float32Array(e*3),i=new Float32Array(e*3),s=new Float32Array(e*3),o=new Lt,a=new P;for(let m=0;m<t;m++){const _=this.gx(m);for(let p=0;p<t;p++){const g=this.gx(p),x=this.idx(p,m),M=this.heights[x],y=x*3;n[y]=g,n[y+1]=M,n[y+2]=_,this.normalAt(g,_,a),s[y]=a.x,s[y+1]=a.y,s[y+2]=a.z;const A=Math.acos(Qe(a.y,-1,1))*180/Math.PI;this._vertexColor(g,_,M,A,o),i[y]=o.r,i[y+1]=o.g,i[y+2]=o.b}}const l=(t-1)*(t-1),c=e>65535?new Uint32Array(l*6):new Uint16Array(l*6);let h=0;for(let m=0;m<t-1;m++)for(let _=0;_<t-1;_++){const p=this.idx(_,m),g=this.idx(_+1,m),x=this.idx(_,m+1),M=this.idx(_+1,m+1);c[h++]=p,c[h++]=x,c[h++]=g,c[h++]=g,c[h++]=x,c[h++]=M}const d=new Ye;d.setAttribute("position",new Te(n,3)),d.setAttribute("normal",new Te(s,3)),d.setAttribute("color",new Te(i,3)),d.setIndex(new Te(c,1)),d.computeBoundingSphere();const u=new _e({vertexColors:!0,roughness:.95,metalness:0}),f=new ht(d,u);return f.name="terrain",f.receiveShadow=!0,f.castShadow=!1,f}buildWater(){const t=new Ds(this.size*1.9,this.size*1.9);t.rotateX(-Math.PI/2);const e=new _e({color:2058882,roughness:.18,metalness:.08,transparent:!0,opacity:.94}),n=new ht(t,e);return n.position.y=dt.WATER_LEVEL,n.name="water",n}}const tx=new P,yn=new Lt;class ex{constructor(t=gr.CELL_SIZE){this.cellSize=t,this.map=new Map,this.boxes=[]}_key(t,e){return t*73856093^e*19349663}add(t,e,n="solid",i=null){const s={min:t,max:e,tag:n,userData:i,id:this.boxes.length};this.boxes.push(s);const o=Math.floor(t.x/this.cellSize),a=Math.floor(e.x/this.cellSize),l=Math.floor(t.z/this.cellSize),c=Math.floor(e.z/this.cellSize);for(let h=l;h<=c;h++)for(let d=o;d<=a;d++){const u=this._key(d,h);let f=this.map.get(u);f||(f=[],this.map.set(u,f)),f.push(s)}return s}addBox3(t,e="solid",n=null){return this.add(t.min.clone(),t.max.clone(),e,n)}query(t,e,n,i,s){s.length=0;const o=Math.floor(t/this.cellSize),a=Math.floor(n/this.cellSize),l=Math.floor(e/this.cellSize),c=Math.floor(i/this.cellSize);this._stamp=(this._stamp||0)+1;const h=this._stamp;for(let d=l;d<=c;d++)for(let u=o;u<=a;u++){const f=this.map.get(this._key(u,d));if(f)for(let m=0;m<f.length;m++){const _=f[m];_._stamp!==h&&(_._stamp=h,s.push(_))}}return s}get count(){return this.boxes.length}}function nx(r,t,e,n,i,s,o){const a=Math.min(Math.max(r,i.min.x),i.max.x),l=Math.min(Math.max(n,i.min.z),i.max.z);let c,h;if(e<i.min.y)c=e,h=i.min.y;else if(t>i.max.y)c=t,h=i.max.y;else{const d=Math.max(t,i.min.y),u=Math.min(e,i.max.y);c=(d+u)*.5,h=c}s.set(r,c,n),o.set(a,h,l)}const Ni=new P,mh=new P,Sn=new P;function gh(r,t,e,n,i,s){s.hitWall=!1,s.hitGround=!1,s.groundY=-1/0,s.wallNormal.set(0,0,0),s.hitCeiling=!1;for(let o=0;o<gr.SOLVER_ITERATIONS;o++){const a=r.y+t,l=r.y+e-t;n.query(r.x-t-.5,r.z-t-.5,r.x+t+.5,r.z+t+.5,i);let c=!1;for(let h=0;h<i.length;h++){const d=i[h];if(d.disabled||d.tag==="trigger"||r.y+e<d.min.y||r.y>d.max.y)continue;nx(r.x,a,l,r.z,d,Ni,mh),Sn.subVectors(Ni,mh);let u=Sn.length();if(u>=t)continue;if(u<1e-6){const m=Ni.x-d.min.x,_=d.max.x-Ni.x,p=Ni.z-d.min.z,g=d.max.z-Ni.z,x=d.max.y-Ni.y;let M=m,y=0,A=-1;_<M&&(M=_,y=0,A=1),p<M&&(M=p,y=2,A=-1),g<M&&(M=g,y=2,A=1),x<M&&(M=x,y=1,A=1),Sn.set(0,0,0),y===0?Sn.x=A:y===1?Sn.y=A:Sn.z=A,u=0}else Sn.divideScalar(u);const f=t-u+gr.SKIN;r.addScaledVector(Sn,f),c=!0,Sn.y>.5?(s.hitGround=!0,d.max.y>s.groundY&&(s.groundY=d.max.y)):Sn.y<-.5?s.hitCeiling=!0:(s.hitWall=!0,s.wallNormal.add(Sn))}if(!c)break}return s.wallNormal.lengthSq()>1e-8&&s.wallNormal.normalize(),s}function ix(){return{hitWall:!1,hitGround:!1,hitCeiling:!1,groundY:-1/0,groundNormalY:1,wallNormal:new P}}class sx{constructor(){this.byKey=new Map,this.total=0}add(t,e,n,i,s,o,a,l="solid"){if(i<=0||s<=0||o<=0)return;const c=a&16777215,h=l==="glass"?"glass":l,d=h==="glass"?`glass:${c}`:`solid:${c}:${h}`;let u=this.byKey.get(d);u||(u=[],this.byKey.set(d,u)),u.push({cx:t,cy:e,cz:n,sx:i,sy:s,sz:o,tag:h,color:c}),this.total++}addSpan(t,e,n,i,s,o,a,l="solid"){this.add((t+i)/2,(e+s)/2,(n+o)/2,Math.abs(i-t),Math.abs(s-e),Math.abs(o-n),a,l)}buildMeshes(t=!0,e=!0){const n=[],i=new Pt(1,1,1),s=new Gt,o=new Dn,a=new P,l=new P;for(const[c,h]of this.byKey){const d=c.startsWith("glass:"),u=h[0].color,f=d?new _e({color:u,roughness:.08,metalness:.4,transparent:!0,opacity:.28,depthWrite:!1,side:Rn}):new _e({color:u,roughness:.9,metalness:0}),m=new dd(i,f,h.length);m.castShadow=!d&&t,m.receiveShadow=e,d&&(m.renderOrder=2,m.name="glass");for(let _=0;_<h.length;_++){const p=h[_];a.set(p.cx,p.cy,p.cz),l.set(p.sx,p.sy,p.sz),s.compose(a,o,l),m.setMatrixAt(_,s),p.mesh=m,p.instanceId=_}m.instanceMatrix.needsUpdate=!0,m.frustumCulled=!1,m.computeBoundingSphere(),n.push(m)}return n}registerCollision(t){for(const[,e]of this.byKey)for(const n of e){const i=t.add(new P(n.cx-n.sx/2,n.cy-n.sy/2,n.cz-n.sz/2),new P(n.cx+n.sx/2,n.cy+n.sy/2,n.cz+n.sz/2),n.tag);n.tag==="glass"&&(i.userData={mesh:n.mesh??null,instanceId:n.instanceId??null})}}}const Ps=[];function rx(){Ps.length=0}function xd(r){!r||r.w<4||r.d<4||Ps.push(r)}const Ie=te.WALL_THICKNESS,_o=te.SLAB_THICKNESS,_h=6992080,$r=.05;function oi(r,t,e,n,i,s,o,a,l=[],c="solid"){const h=(_,p,g,x)=>{p-_<=1e-4||x-g<=1e-4||(t==="x"?r.addSpan(_,g,e-Ie/2,p,x,e+Ie/2,a,c):r.addSpan(e-Ie/2,g,_,e+Ie/2,x,p,a,c))},d=(_,p,g,x)=>{p-_<=1e-4||x-g<=1e-4||g<=s+.25||(t==="x"?r.addSpan(_+.02,g+.02,e-$r/2,p-.02,x-.02,e+$r/2,_h,"glass"):r.addSpan(e-$r/2,g+.02,_+.02,e+$r/2,x-.02,p-.02,_h,"glass"))},u=[];for(const _ of l){const p=Math.max(n,_.a0),g=Math.min(i,_.a1);g-p<=1e-4||u.push({a0:p,a1:g,y0:Math.max(s,_.y0),y1:Math.min(o,_.y1)})}if(!u.length){h(n,i,s,o);return}const f=new Set([n,i]);for(const _ of u)f.add(_.a0),f.add(_.a1);const m=[...f].sort((_,p)=>_-p);for(let _=0;_<m.length-1;_++){const p=m[_],g=m[_+1];if(g-p<=1e-4)continue;const x=(p+g)/2,M=u.filter(A=>A.a0<=x&&A.a1>=x).map(A=>[A.y0,A.y1]).sort((A,w)=>A[0]-w[0]);let y=s;for(const[A,w]of M)A>y&&h(p,g,y,A),w>y&&(d(p,g,A,w),y=w);h(p,g,y,o)}}function Vi(r,t,e,n,i,s,o,a=null){const l=s-_o,c=a?Array.isArray(a)?a:[a]:[];if(!c.length){r.addSpan(t,l,e,n,s,i,o);return}const h=[t,n];for(const u of c)h.push(Math.max(t,u.x0),Math.min(n,u.x1));const d=[...new Set(h.filter(u=>u>=t-1e-6&&u<=n+1e-6))].sort((u,f)=>u-f);for(let u=0;u<d.length-1;u++){const f=d[u],m=d[u+1];if(m-f<1e-4)continue;const _=(f+m)*.5,p=c.filter(M=>M.x0<_&&M.x1>_);if(!p.length){r.addSpan(f,l,e,m,s,i,o);continue}const g=[e,i];for(const M of p)g.push(Math.max(e,M.z0),Math.min(i,M.z1));const x=[...new Set(g.filter(M=>M>=e-1e-6&&M<=i+1e-6))].sort((M,y)=>M-y);for(let M=0;M<x.length-1;M++){const y=x[M],A=x[M+1];if(A-y<1e-4)continue;const w=(y+A)*.5;p.some(E=>E.z0<w&&E.z1>w)||r.addSpan(f,l,y,m,s,A,o)}}}function ox(r,t,e,n,i,s,o,a){const l=te.STAIR_STEPS_PER_FLOOR,c=o/l,h=(i-n)/l;for(let d=0;d<l;d++){const u=n+d*h,f=u+h,m=s+(d+1)*c,_=Math.max(s,m-te.STAIR_THICKNESS);r.addSpan(t,_,u,e,m,f,a)}}function ax(r){const t=[0];for(let e=0;e<r;e++)t.push(t[e]+(e===0?te.GROUND_FLOOR_HEIGHT:te.FLOOR_HEIGHT));return t}function Ne(r,t){const{x:e,z:n,w:i,d:s,floors:o,baseY:a,color:l,rng:c}=t,h=te.ROOF_COLOR,d=te.FLOOR_COLOR,u=ax(o),f=Math.min(Math.max(te.STAIR_WIDTH,1.5),Math.max(1.5,i*.38)),m=Math.min(5.4,Math.max(4.2,s*.48)),_=e+i-f-.45,p=e+i-.45,g=n+s-m-.4,y=n+s-.4-1.4,A={x0:_-.12,z0:g-.12,x1:p+.12,z1:y+.12};Vi(r,e,n,e+i,n+s,a+te.GROUND_SLAB_LIFT,d);const w=te.DOOR_HEIGHT,E=te.DOOR_WIDTH,L=te.WINDOW_SILL,U=te.WINDOW_SILL+te.WINDOW_HEIGHT;for(let D=0;D<o;D++){const F=a+u[D],q=a+u[D+1]-_o,O=D===0,z=(j,pt)=>{const It=[],X=pt-j,$=Math.max(1,Math.floor(X/4.5)),rt=X/$;for(let J=0;J<$;J++){const st=j+rt*(J+.5);It.push({a0:st-.85,a1:st+.85,y0:F+L,y1:F+U})}return It},G=(j,pt)=>{const It=pt-E/2,X=pt+E/2,$=j.filter(rt=>rt.a1<=It+1e-4||rt.a0>=X-1e-4);return $.push({a0:It,a1:X,y0:F,y1:F+w}),$};let et=z(e,e+i),K=z(n,n+s);if(O&&(et=G(et,e+i*.5),K=G(K,n+s*.32)),oi(r,"x",n+Ie/2,e,e+i,F,q,l,et),oi(r,"x",n+s-Ie/2,e,e+i,F,q,l,z(e,e+i)),oi(r,"z",e+Ie/2,n,n+s,F,q,l,z(n,n+s)),oi(r,"z",e+i-Ie/2,n,n+s,F,q,l,K),ox(r,_,p,g,y,F,u[D+1]-u[D],d),Vi(r,e,n,e+i,n+s,a+u[D+1],D===o-1?h:d,A),!O&&i>9&&c()>.35){const j=e+i*(.4+c()*.2),pt=n+s*.5;oi(r,"z",j,n+Ie,n+s-Ie,F,q,d,[{a0:pt-.6,a1:pt+.6,y0:F,y1:F+w}],"thin")}}const v=a+u[o],S=te.PARAPET_HEIGHT;r.addSpan(e,v,n,e+i,v+S,n+Ie*1.5,l),r.addSpan(e,v,n+s-Ie*1.5,e+i,v+S,n+s,l),r.addSpan(e,v,n,e+Ie*1.5,v+S,n+s,l),r.addSpan(e+i-Ie*1.5,v,n,e+i,v+S,n+s,l);const I=[];for(let D=0;D<o;D++)I.push(a+u[D]+te.GROUND_SLAB_LIFT*(D===0?1:0)+.02),D>0?I[D]=a+u[D]+.02:I[0]=a+te.GROUND_SLAB_LIFT+.02;return xd({x:e,z:n,w:i,d:s,floors:o,baseY:a,floorYs:I,roofY:v}),{roofY:v,height:u[o]}}function He(r,t){const{x:e,z:n,w:i,d:s,h:o,baseY:a,color:l,doorW:c=3.2}=t,h=te.FLOOR_COLOR;Vi(r,e,n,e+i,n+s,a+te.GROUND_SLAB_LIFT,h);const d=a,u=a+o,f=e+i/2,m=n+s/2;return oi(r,"x",n+Ie/2,e,e+i,d,u,l,[{a0:f-c/2,a1:f+c/2,y0:d,y1:d+Math.min(o-.4,4)}]),oi(r,"x",n+s-Ie/2,e,e+i,d,u,l,[]),oi(r,"z",e+Ie/2,n,n+s,d,u,l,[]),oi(r,"z",e+i-Ie/2,n,n+s,d,u,l,[{a0:m-c/2,a1:m+c/2,y0:d,y1:d+Math.min(o-.4,4)}]),Vi(r,e,n,e+i,n+s,u+_o,te.ROOF_COLOR),{roofY:u+_o}}class Bl{constructor(t=10){this.cell=t,this.rects=[],this.buckets=new Map}_key(t,e){return`${t},${e}`}_bucketRange(t,e,n,i){const s=this.cell;return{ix0:Math.floor(t/s),iz0:Math.floor(e/s),ix1:Math.floor(n/s),iz1:Math.floor(i/s)}}claim(t,e,n,i,s=1.5,o=!1){const a=t-s,l=e-s,c=t+n+s,h=e+i+s;if(!o&&this.blocked(a,l,c,h))return!1;this.rects.push({x0:a,z0:l,x1:c,z1:h});const{ix0:d,iz0:u,ix1:f,iz1:m}=this._bucketRange(a,l,c,h),_=this.rects.length-1;for(let p=u;p<=m;p++)for(let g=d;g<=f;g++){const x=this._key(g,p);let M=this.buckets.get(x);M||(M=[],this.buckets.set(x,M)),M.push(_)}return!0}blocked(t,e,n,i){const{ix0:s,iz0:o,ix1:a,iz1:l}=this._bucketRange(t,e,n,i),c=new Set;for(let h=o;h<=l;h++)for(let d=s;d<=a;d++){const u=this.buckets.get(this._key(d,h));if(u)for(const f of u){if(c.has(f))continue;c.add(f);const m=this.rects[f];if(t<m.x1&&n>m.x0&&e<m.z1&&i>m.z0)return!0}}return!1}tryClaim(t,e,n,i,s=1.5){return this.claim(t,e,n,i,s)}}class lx{constructor(){this.volumes=[]}clear(){this.volumes.length=0}add(t,e,n,i,s,o){s<=e||this.volumes.push({x0:Math.min(t,i),y0:e,z0:Math.min(n,o),x1:Math.max(t,i),y1:s,z1:Math.max(n,o),cx:(t+i)*.5,cz:(n+o)*.5})}findAt(t,e,n,i=.45){const s=i+.15;for(const o of this.volumes)if(!(t<o.x0-s||t>o.x1+s)&&!(n<o.z0-s||n>o.z1+s)&&!(e+.2<o.y0-.4||e>o.y1+.2))return o;return null}}const zl=new lx,cx=1976368,hx=6992080,dx=11052704,Hl={specs:[],clear(){this.specs.length=0},register(r){this.specs.push(r)}};function xh(r,t,e){const n=new $t,i=new ht(new Pt(r*.96,t-.08,e),new _e({color:cx,roughness:.85,metalness:.05}));i.position.set(r*.5,t*.5,0),i.castShadow=!0,n.add(i);const s=new ht(new Pt(r*.55,t*.35,e*.4),new _e({color:hx,roughness:.2,metalness:.1,transparent:!0,opacity:.65}));s.position.set(r*.5,t*.58,e*.2),n.add(s);const o=new ht(new Pt(.04,.22,.08),new _e({color:dx,roughness:.4,metalness:.6}));return o.position.set(r*.85,t*.45,e*.55),n.add(o),n}class ux{constructor(t){this.hash=t,this.doors=[],this.group=new $t,this.group.name="doors",this._near=null}clear(){for(this.doors.length=0;this.group.children.length;)this.group.remove(this.group.children[0])}buildFromRegistry(){this.clear();for(const t of Hl.specs)this._addDoor(t);return this.doors.length}_addDoor(t){const e=t.width,n=t.height,i=t.thickness??.12,s=e*.5,o=t.face||"S",a=new $t;a.position.set(t.x,t.y,t.z),o==="S"?a.rotation.y=0:o==="N"?a.rotation.y=Math.PI:o==="E"?a.rotation.y=-Math.PI/2:o==="W"&&(a.rotation.y=Math.PI/2);const l=new $t;l.position.set(-s,0,0);const c=xh(s,n,i);l.add(c);const h=new $t;h.position.set(s,0,0);const d=xh(s,n,i);d.scale.x=-1,h.add(d),a.add(l),a.add(h),this.group.add(a);const u=this._closedCollision(t,e,n,i,o),f={spec:t,root:a,leftPivot:l,rightPivot:h,leftBox:u.left,rightBox:u.right,open:!1,openAmount:0,targetOpen:0,cx:t.x,cy:t.y+n*.5,cz:t.z,reach:Math.max(2.4,e*.75+1.2)};return this.doors.push(f),f}_closedCollision(t,e,n,i,s){const o=e*.5,a=t.y,l=t.y+n,c=Math.max(.14,i+.06);let h,d,u,f;if(s==="S"||s==="N"){const m=t.z-c*.5,_=t.z+c*.5;h=new P(t.x-o,a,m),d=new P(t.x,l,_),u=new P(t.x,a,m),f=new P(t.x+o,l,_)}else{const m=t.x-c*.5,_=t.x+c*.5;h=new P(m,a,t.z-o),d=new P(_,l,t.z),u=new P(m,a,t.z),f=new P(_,l,t.z+o)}return{left:this.hash.add(h,d,"door"),right:this.hash.add(u,f,"door")}}findNearest(t,e,n){let i=null,s=1/0;for(const o of this.doors){const a=t-o.cx,l=e-o.cy,c=n-o.cz,h=Math.hypot(a,l*.5,c);h<o.reach&&h<s&&(s=h,i=o)}return this._near=i,i}tryToggle(t,e,n){const i=this.findNearest(t,e,n);return i?(i.open=!i.open,i.targetOpen=i.open?1:0,!0):!1}update(t){for(const n of this.doors){const i=n.targetOpen-n.openAmount;if(Math.abs(i)<1e-4)n.openAmount=n.targetOpen;else{const a=Math.sign(i)*3.2*t;Math.abs(a)>Math.abs(i)?n.openAmount=n.targetOpen:n.openAmount+=a}const s=n.openAmount;n.leftPivot.rotation.y=-s*(Math.PI*.5),n.rightPivot.rotation.y=s*(Math.PI*.5);const o=s<.5;n.leftBox.disabled=!o,n.rightBox.disabled=!o}}prompt(t,e,n){const i=this.findNearest(t,e,n);return i?i.open||i.openAmount>.5?"E · Close door":"E · Open door":null}}const Gl={specs:[],clear(){this.specs.length=0},register(r){this.specs.push(r)}};function Mh(r,t){const e=r.deck??.16;return r.baseY+t*r.floorH+e}class fx{constructor(t){this.hash=t,this.cars=[],this.group=new $t,this.group.name="elevators",this._near=null}clear(){for(this.cars.length=0;this.group.children.length;)this.group.remove(this.group.children[0])}buildFromRegistry(){this.clear();for(const t of Gl.specs)this._addCar(t);return this.cars.length}_addCar(t){const e=t.x1-t.x0,n=t.z1-t.z0,i=(t.x0+t.x1)*.5,s=(t.z0+t.z1)*.5,o=Math.min(t.floors-1,Math.max(0,t.startFloor??0)),a=Mh(t,o),l=t.doorFace||"S",c=new $t;c.position.set(i,a,s);const h=new _e({color:3820122,roughness:.7,metalness:.2}),d=new _e({color:4876938,roughness:.55,metalness:.25}),u=new _e({color:2766144,roughness:.8}),f=new ht(new Pt(e*.96,.1,n*.96),h);f.position.y=.05,f.receiveShadow=!0,c.add(f);const m=Math.min(1.35,t.floorH*.35),_=.04,p=e*.46,g=n*.46,x=(S,I,D,F,q,O)=>{const z=new ht(new Pt(S,I,D),d);z.position.set(F,q,O),z.castShadow=!0,c.add(z)};l!=="S"&&x(e*.88,m,_,0,m*.5+.08,-g),l!=="N"&&x(e*.88,m,_,0,m*.5+.08,g),l!=="W"&&x(_,m,n*.82,-p,m*.5+.08,0),l!=="E"&&x(_,m,n*.82,p,m*.5+.08,0);const M=new ht(new Pt(.28,.05,.28),new _e({color:11599648,emissive:4218896,emissiveIntensity:.7}));M.position.y=Math.min(2.4,t.floorH-.9),c.add(M);const y=new ht(new Pt(e*.45,.04,n*.45),u);y.position.y=M.position.y+.06,c.add(y);const A=this._makeFloorPanel(e,n,l);c.add(A.mesh),this.group.add(c);const w=.02,E=this.hash.add(new P(t.x0+w,a-.02,t.z0+w),new P(t.x1-w,a+.08,t.z1-w),"elevator");let L=0,U=0;l==="S"?U=-1:l==="N"?U=1:l==="W"?L=-1:L=1;const v={spec:t,root:c,floorBox:E,floor:o,targetFloor:o,y:a,targetY:a,moving:!1,dir:1,ridePlayer:!1,justArrived:!1,arriveT:0,cx:i,cz:s,halfW:e*.5,halfD:n*.5,doorFace:l,exitX:L,exitZ:U,floorPanel:A};this._paintFloorPanel(v),this.cars.push(v)}_makeFloorPanel(t,e,n){const i=document.createElement("canvas");i.width=256,i.height=128;const s=new o_(i);s.colorSpace=Be,s.flipY=!0;const o=new ln({map:s,transparent:!0,side:Vn}),a=new ht(new Ds(.7,.35),o),l=.02;return n==="S"?(a.position.set(0,1.55,e*.42-l),a.rotation.y=Math.PI):n==="N"?(a.position.set(0,1.55,-e*.42+l),a.rotation.y=0):n==="W"?(a.position.set(t*.42-l,1.55,0),a.rotation.y=-Math.PI/2):(a.position.set(-t*.42+l,1.55,0),a.rotation.y=Math.PI/2),{mesh:a,canvas:i,tex:s,mat:o}}_paintFloorPanel(t){const e=t.floorPanel;if(!e)return;const n=e.canvas.getContext("2d"),i=t.floor+1,s=t.spec.floors,o=t.floor>=t.spec.floors-1,a=t.floor<=0;n.fillStyle=o?"#1a4020":a?"#1a3040":"#121820",n.fillRect(0,0,256,128),n.strokeStyle=o?"#60ff90":"#40c0ff",n.lineWidth=6,n.strokeRect(4,4,248,120),n.fillStyle=o?"#80ffb0":"#e8f4ff",n.font="bold 52px ui-monospace, Menlo, monospace",n.textAlign="center",n.textBaseline="middle",n.fillText(`${i} / ${s}`,128,o||a?48:64),n.font="bold 28px ui-monospace, Menlo, monospace",o?(n.fillStyle="#a0ffc0",n.fillText("TOP FLOOR",128,96)):a&&(n.fillStyle="#80d0ff",n.fillText("GROUND",128,96)),e.tex.needsUpdate=!0}_setCarY(t,e){t.y=e,t.root.position.y=e,t.floorBox.min.y=e-.02,t.floorBox.max.y=e+.08}playerInCabin(t,e,n,i){const s=t.spec;return e<s.x0-.05||e>s.x1+.05||i<s.z0-.05||i>s.z1+.05?!1:n>=t.y-.5&&n<=t.y+2.6}findNear(t,e,n){let i=null,s=1/0;for(const o of this.cars){const a=o.spec,l=a.x0-1.4,c=a.x1+1.4,h=a.z0-1.4,d=a.z1+1.4;if(t<l||t>c||n<h||n>d)continue;const u=a.baseY-.5,f=a.baseY+a.floors*a.floorH+1;if(e<u||e>f)continue;const m=Math.hypot(t-o.cx,n-o.cz);m<s&&(s=m,i=o)}return this._near=i,i}tryUse(t){const e=t.pos.x,n=t.pos.y,i=t.pos.z,s=this.findNear(e,n,i);if(!s)return!1;if(s.moving)return!0;const o=s.spec;if(this.playerInCabin(s,e,n,i)){let h=s.floor+s.dir;return h>=o.floors?(s.dir=-1,h=s.floor-1):h<0&&(s.dir=1,h=s.floor+1),h===s.floor||h<0||h>=o.floors||this._startRide(s,h,!0),!0}const l=n-o.baseY;let c=Math.round(l/o.floorH);return c=Math.max(0,Math.min(o.floors-1,c)),c!==s.floor&&this._startRide(s,c,!1),!0}_startRide(t,e,n){const i=t.spec;e=Math.max(0,Math.min(i.floors-1,e)),!(e===t.floor&&!t.moving)&&(t.targetFloor=e,t.targetY=Mh(i,e),t.moving=!0,t.ridePlayer=n,t.justArrived=!1,e>t.floor?t.dir=1:e<t.floor&&(t.dir=-1))}update(t,e){for(const i of this.cars){if(i.moving){const c=i.targetY-i.y;if(Math.abs(c)<.025)this._setCarY(i,i.targetY),i.floor=i.targetFloor,i.moving=!1,i.justArrived=!1,i.ridePlayer=!1,this._paintFloorPanel(i),e&&this.playerInCabin(i,e.pos.x,e.pos.y,e.pos.z)&&(e.pos.y=i.y+.04,e.vel.y=0,e.grounded=!0);else{const h=Math.sign(c)*4.2*t,d=Math.abs(h)>Math.abs(c)?i.targetY:i.y+h;this._setCarY(i,d)}}if(!e)continue;const s=e.pos.x,o=e.pos.y,a=e.pos.z;this.playerInCabin(i,s,o,a)&&i.moving&&(i.ridePlayer=!0,e.pos.y=i.y+.04,e.vel.y=0,e.grounded=!0,e.coyote=.12)}}prompt(t,e,n){const i=this.findNear(t,e,n);if(!i)return null;const s=i.floor+1,o=i.spec.floors,a=i.floor>=i.spec.floors-1,l=i.floor<=0;if(i.moving)return`Elevator · → ${i.targetFloor+1}/${o}${i.targetFloor>=i.spec.floors-1?" TOP":""}…`;if(this.playerInCabin(i,t,e,n)){if(a)return`E · TOP FLOOR ${s}/${o} · Down only`;if(l)return`E · Floor ${s}/${o} GROUND · Up`;const f=i.dir>=0?"Up":"Down";return`E · Floor ${s}/${o} · ${f}`}const c=i.spec;let h=Math.round((e-c.baseY)/c.floorH);h=Math.max(0,Math.min(c.floors-1,h));const d=h+1,u=i.floor+1;return h===i.floor?a?`E · Elevator here · TOP ${s}/${o}`:`E · Elevator here · Floor ${s}/${o}`:`E · Call elevator · you ${d} · car ${u}${i.floor>=c.floors-1?" TOP":""}`}}const R={white:15921386,cream:15261648,brick:10108980,brickDark:6958630,red:13643816,redHot:16726570,yellow:15774720,yellowHot:16764992,blue:2779802,blueLite:4889296,teal:1743496,green:3836462,lime:6994490,orange:14708768,gray:10131600,dark:3815476,metal:8026228,metalLite:11052704,asphalt:3026738,glass:6992080,glassDark:3824240,wood:10123856,woodDark:6967344,sand:13943968,concrete:12105392,neonPink:16728224,neonCyan:2156799,neonLime:11599648};function we(r,t){return t[Math.floor(r()*t.length)%t.length]}function px(r,t){if(!r&&!t)return[[0,0]];const e=[0,.2,.4,.5,.6,.8,1],n=[0,.2,.4,.5,.6,.8,1],i=[];for(const s of e)for(const o of n)i.push([s,o]);return i}function ll(r,t,e,n=0,i=0){let s=1/0,o=-1/0,a=0,l=0;for(const[c,h]of px(n,i)){const d=r.heightAt(t+n*c,e+i*h);d<s&&(s=d),d>o&&(o=d),a+=d,l++}return{min:s,max:o,avg:a/l,delta:o-s}}function Md(r,t,e,n=0,i=0,s=null){var l;const o=s??(hr==null?void 0:hr.maxFootprintDelta)??1.25,a=ll(r,t,e,n,i);return!Number.isFinite(a.min)||a.min<2.5||a.delta>o||r.downtownPlateY!=null&&((l=r.onDowntownPlate)!=null&&l.call(r,t+n*.5,e+i*.5))&&a.max<r.downtownPlateY-1.5?null:a.max}function mn(r,t,e,n=0,i=0){const s=Md(r,t,e,n,i,99);return s??r.heightAt(t,e)}function kt(r,t,e,n,i,s=.35,o=R.metal){r.addSpan(t,e,n,t+s,e+i,n+s,o)}function ve(r,t,e,n,i,s,o,a){r.addSpan(t,e,n,i,s,o,a)}function Bs(r,t,e,n,i,s=null){const o=s??we(i,[2771594,9052192,1731130,12886048,1710618,13684944,6957706,14708768]),a=4.5+i()*1.2,l=1.9,c=1.35+i()*.4;r.addSpan(t,n+.28,e,t+a,n+c*.55,e+l,o),r.addSpan(t+a*.28,n+c*.48,e+.12,t+a*.72,n+c,e+l-.12,R.glassDark),r.addSpan(t+.1,n+c*.5,e+.15,t+a*.28,n+c*.58,e+l-.15,o);const h=.42;for(const[d,u]of[[.55,-.05],[.55,l-.15],[a-.9,-.05],[a-.9,l-.15]])r.addSpan(t+d,n,e+u,t+d+.55,n+h,e+u+.35,R.dark);r.addSpan(t+a-.12,n+.45,e+.15,t+a,n+.7,e+.45,R.yellowHot),r.addSpan(t+a-.12,n+.45,e+l-.45,t+a,n+.7,e+l-.15,R.yellowHot),r.addSpan(t,n+.5,e+.2,t+.1,n+.72,e+.5,R.redHot),r.addSpan(t,n+.5,e+l-.5,t+.1,n+.72,e+l-.2,R.redHot)}function vd(r,t,e,n,i){const s=we(i,[R.red,R.white,R.blue,R.yellow]);r.addSpan(t,n+.35,e,t+3.2,n+2.4,e+2.3,s),r.addSpan(t+3,n+.5,e+.1,t+8.5,n+2.8,e+2.2,R.metalLite);for(const o of[.6,6.8])r.addSpan(t+o,n,e-.1,t+o+.7,n+.55,e+.35,R.dark),r.addSpan(t+o,n,e+1.95,t+o+.7,n+.55,e+2.4,R.dark)}function mx(r,t,e,n,i){const s=11+i()*5,o=9+i()*4,a=mn(t,e,n,s,o),l=i()>.5?2:1,c=we(i,[R.cream,R.white,R.brick,13154464,11059408,13682872]);if(Ne(r,{x:e,z:n,w:s,d:o,floors:l,baseY:a,color:c,rng:i}),r.addSpan(e+s*.2,a,n-2.2,e+s*.55,a+.2,n,R.wood),kt(r,e+s*.22,a,n-2,2.4,.2,R.wood),kt(r,e+s*.5,a,n-2,2.4,.2,R.wood),r.addSpan(e+s*.2,a+2.3,n-2.2,e+s*.55,a+2.55,n,R.woodDark),i()>.4){const h=a+te.GROUND_FLOOR_HEIGHT+(l-1)*te.FLOOR_HEIGHT;r.addSpan(e+s*.7,h,n+o*.3,e+s*.7+1.1,h+2.4,n+o*.3+1.1,R.brickDark)}if(i()>.3){const u=e+s+.8;He(r,{x:u,z:n,w:6,d:7,h:3.4,baseY:mn(t,u,n,6,7),color:we(i,[R.gray,R.white,c]),doorW:4.2}),r.addSpan(u,a-.05,n-6,u+6,a+.08,n,R.asphalt),i()>.45&&Bs(r,u+.5,n-5.2,a,i)}for(let h=0;h<5;h++){const d=e-1.5+h*3.2;r.addSpan(d,a,n+o+1.5,d+2.8,a+1.15,n+o+1.7,R.wood,"thin")}if(kt(r,e-1.2,a,n-1.5,1.2,.15,R.metal),r.addSpan(e-1.5,a+1,n-1.7,e-.7,a+1.45,n-1.2,R.dark),i()>.35){const h=e-3,d=n+o*.4;kt(r,h,a,d,2.2,.35,R.woodDark),r.addSpan(h-1.2,a+1.8,d-1.2,h+1.6,a+4,d+1.6,R.green),r.addSpan(h-.8,a+3.6,d-.8,h+1.2,a+5,d+1.2,R.lime)}}function gx(r,t,e,n,i){const s=11+i()*5,o=3.5,a=mn(t,e,n,s,o)+.35,l=we(i,[R.cream,R.metalLite,11575440,R.blueLite,R.teal,R.white]);r.addSpan(e+.5,a-.35,n+.4,e+1,a,n+.9,R.metal),r.addSpan(e+s-1.2,a-.35,n+.4,e+s-.7,a,n+.9,R.metal),r.addSpan(e+.5,a-.35,n+o-1,e+1,a,n+o-.5,R.metal),r.addSpan(e+s-1.2,a-.35,n+o-1,e+s-.7,a,n+o-.5,R.metal),r.addSpan(e,a,n,e+s,a+2.6,n+o,l),ve(r,e,a+1.1,n-.02,e+s,a+1.35,n+.05,we(i,[R.red,R.teal,R.yellow,R.blue])),r.addSpan(e+s*.4,a+2.6,n+.6,e+s*.4+1.8,a+3.15,n+2.2,R.metal),r.addSpan(e+2,a+1.2,n-.05,e+3.5,a+2.1,n+.08,R.glass),r.addSpan(e+s-4,a+1.2,n-.05,e+s-2.2,a+2.1,n+.08,R.glass),r.addSpan(e+s*.45,a-.35,n-1.4,e+s*.45+1.4,a+.15,n,R.wood),r.addSpan(e+s*.4,a+2.2,n-1.6,e+s*.4+2.2,a+2.45,n+.2,we(i,[R.teal,R.orange,R.blue])),r.addSpan(e+s-.9,a,n+o+.3,e+s-.2,a+1.1,n+o+1,R.metalLite)}function ir(r,t,e,n,i){const s=mn(t,e,n,30,24);r.addSpan(e-2,s-.06,n-2,e+26,s+.04,n+22,R.asphalt),r.addSpan(e,s+4.4,n,e+24,s+4.9,n+15,R.yellowHot),ve(r,e,s+4.85,n-.1,e+24,s+5.15,n+.25,R.neonCyan),ve(r,e,s+4.85,n+14.75,e+24,s+5.15,n+15.1,R.neonCyan);for(const[o,a]of[[1.5,1.5],[22,1.5],[1.5,13],[22,13],[12,1.5],[12,13]])kt(r,e+o,s,n+a,4.4,.45,R.metalLite);for(let o=0;o<4;o++){const a=e+4+o*5;r.addSpan(a-.3,s,n+5.5,a+2,s+.25,n+9.5,R.concrete),r.addSpan(a,s+.25,n+6.2,a+1.4,s+1.7,n+7.6,R.dark),r.addSpan(a-.15,s+1.7,n+6,a+1.55,s+2.55,n+7.8,R.redHot),ve(r,a+.2,s+2.4,n+6.3,a+1.2,s+2.65,n+7.5,R.yellowHot)}He(r,{x:e+2,z:n+16,w:16,d:9,h:4,baseY:s,color:R.white,doorW:2.6}),ve(r,e+2,s+3.5,n+15.9,e+18,s+3.95,n+16.15,R.neonPink),kt(r,e-3,s,n+3,10,.5,R.metal),r.addSpan(e-5.5,s+7.5,n+2,e-.5,s+11.2,n+4.2,R.yellowHot),ve(r,e-5.3,s+10.6,n+2.1,e-.7,s+11,n+4.1,R.neonLime),r.addSpan(e+20,s,n+17,e+21.2,s+1.1,n+18.2,R.dark),kt(r,e+22,s,n+6,1.4,.25,R.metal)}function Tn(r,t,e,n,i,s=!0){const o=mn(t,e,n,22,16),a=s?we(i,[R.redHot,R.orange,R.yellowHot,R.teal,R.neonPink]):we(i,[R.brick,R.cream,R.dark,R.woodDark]),l=15+i()*5,c=12+i()*4;if(Ne(r,{x:e,z:n,w:l,d:c,floors:s?1:1+(i()>.5?1:0),baseY:o,color:s?R.white:a,rng:i}),ve(r,e-.1,o+3.6,n-.15,e+l+.1,o+4.4,n+.2,a),r.addSpan(e+l*.35,o+4.4,n+c*.3,e+l*.65,o+6.5,n+c*.65,a),s){r.addSpan(e+l+1,o+3,n+1,e+l+9,o+3.45,n+c-1,a),kt(r,e+l+1.5,o,n+2,3,.3),kt(r,e+l+8,o,n+2,3,.3),kt(r,e+l+1.5,o,n+c-3,3,.3),r.addSpan(e+l+3,o,n-2,e+l+5.5,o+2.8,n-.5,R.dark),ve(r,e+l+3.1,o+2.4,n-1.9,e+l+5.4,o+2.7,n-.6,R.neonCyan),r.addSpan(e-8,o-.05,n-8,e+l+10,o+.03,n-.5,R.asphalt);for(let h=0;h<3;h++)Bs(r,e-6+h*5.5,n-6.5,o,i)}else{r.addSpan(e+1,o+2.6,n-3,e+l-1,o+2.9,n,a);for(let h=0;h<4;h++){const d=e+2+h*3.2;r.addSpan(d,o,n-2.5,d+1.3,o+.9,n-1.2,R.wood),kt(r,d+.2,o+.9,n-2.3,.7,.12,R.metal)}}}function cl(r,t,e,n,i){const s=mn(t,e,n,24,18);r.addSpan(e-1,s-.05,n-4,e+22,s+.04,n+16,R.asphalt),He(r,{x:e,z:n,w:20,d:15,h:6.2,baseY:s,color:R.metal,doorW:6.5}),ve(r,e,s+5.5,n-.1,e+20,s+6,n+.15,R.orange);for(let o=0;o<2;o++){const a=e+3+o*8;r.addSpan(a,s,n+3,a+5,s+.15,n+11,R.asphalt),kt(r,a+.3,s,n+4,2.2,.25,R.yellow),kt(r,a+4.2,s,n+4,2.2,.25,R.yellow),kt(r,a+.3,s,n+9.5,2.2,.25,R.yellow),kt(r,a+4.2,s,n+9.5,2.2,.25,R.yellow),r.addSpan(a+.5,s+1.8,n+4.2,a+4.3,s+2.1,n+9.8,R.metalLite)}for(let o=0;o<5;o++)r.addSpan(e+17,s+o*.4,n+1,e+18.5,s+(o+1)*.4,n+2.5,R.dark);for(let o=0;o<3;o++)r.addSpan(e+18.8,s,n+4+o*1.4,e+19.8,s+1,n+5+o*1.4,we(i,[R.blue,R.red,R.dark]));Bs(r,e+2,n-3.5,s,i,R.dark),vd(r,e+10,n-3.8,s,i),kt(r,e-2,s,n+4,7,.4),r.addSpan(e-4,s+5.5,n+3,e-.5,s+7.8,n+5.2,R.orange)}function sr(r,t,e,n,i){const s=mn(t,e,n,36,22);r.addSpan(e-2,s-.05,n-8,e+38,s+.04,n+20,R.concrete),He(r,{x:e,z:n,w:26,d:18,h:7.2,baseY:s,color:R.white,doorW:7}),ve(r,e,s+6.3,n-.12,e+26,s+7,n+.2,R.redHot);for(let o=0;o<3;o++){const a=e+3+o*8;ve(r,a,s,n-.08,a+.35,s+5.5,n+.12,R.red),ve(r,a+5.5,s,n-.08,a+5.85,s+5.5,n+.12,R.red)}Ne(r,{x:e+27,z:n,w:14,d:16,floors:3,baseY:s,color:R.brick,rng:i}),r.addSpan(e+20,s,n+14,e+24.5,s+16,n+18.5,R.red),r.addSpan(e+20.5,s+16,n+14.5,e+24,s+17.2,n+18,R.white),ve(r,e+21.5,s+17,n+15.5,e+23,s+18.5,n+17,R.redHot),r.addSpan(e+2,s,n-7,e+10,s+2.6,n-3.5,R.redHot),r.addSpan(e+3,s+2.4,n-6.5,e+8,s+3.3,n-4,R.dark),r.addSpan(e+12,s,n-7,e+20,s+2.6,n-3.5,R.red),kt(r,e+28,s,n-4,9,.2,R.metalLite),r.addSpan(e+28.2,s+7.5,n-4,e+31,s+9,n-3.5,R.redHot)}function ds(r,t,e,n,i){const s=mn(t,e,n,32,26)-.06,o=4+Math.floor(i()*4),a=20+i()*10,l=16+i()*8;Ne(r,{x:e,z:n,w:a,d:l,floors:o,baseY:s,color:we(i,[R.glass,R.glassDark,R.white,9083048,5924976]),rng:i}),Ed(r,e,n,a,l,s,o,te.FLOOR_HEIGHT,i,-1,!1,t);for(let c=1;c<o;c++){const h=s+te.GROUND_FLOOR_HEIGHT+(c-1)*te.FLOOR_HEIGHT+1.2;ve(r,e-.08,h,n-.08,e+a+.08,h+.35,n+.08,R.glass)}r.addSpan(e-4,s-.04,n-8,e+a+4,s+.05,n,R.concrete);for(let c=0;c<4;c++){const h=e+2+c*(a/4);r.addSpan(h,s,n-5.5,h+2.2,s+.65,n-3.2,R.sand),r.addSpan(h+.4,s+.65,n-5.1,h+1.8,s+2.4,n-3.6,R.green),r.addSpan(h+.7,s+2.2,n-4.7,h+1.5,s+3.3,n-4,R.lime)}r.addSpan(e+a*.4,s,n-7.5,e+a*.6,s+.4,n-5.8,R.concrete),r.addSpan(e+a*.45,s+.4,n-7.1,e+a*.55,s+1.3,n-6.2,R.blueLite)}function _x(r,t,e,n,i,s,o,a){const l=t+n+.12,c=2.85,h=1.25,u=h*2+2.8,f=e+Math.max(.4,(i-u)*.5),m=f+u,_=1.25,p=l+.08,g=p+_,x=l+c-_-.08,M=x+_,y=o,A=Math.max(10,Math.ceil(a/.34)),w=a/A,E=.1;for(let U=0;U<=y;U++){const v=s+U*a;if(r.addSpan(l,v,f,l+c,v+.12,f+h,R.metalLite),r.addSpan(l,v,m-h,l+c,v+.12,m,R.metalLite),r.addSpan(l+c-.06,v+.12,f,l+c,v+.9,m,R.metal,"thin"),U>=y)break;const S=U%2===0,I=S?p:x,D=S?g:M,F=S?f+h-.05:m-h+.05,O=((S?m-h+.05:f+h-.05)-F)/A;for(let z=0;z<A;z++){const G=v+(z+1)*w,et=F+z*O,K=F+(z+1)*O,j=Math.min(et,K),pt=Math.max(et,K);r.addSpan(I,G-E,j,D,G,pt,R.metal)}}r.addSpan(l-.15,s-.04,f-.3,l+c+.05,s+.08,f+h,R.concrete);const L=s+o*a;r.addSpan(t+n*.12,L,f+h*.3,l+.2,L+.12,f+h+.8,R.metalLite)}function xx(r,t,e,n,i,s={}){if(i-n<.5)return;const a=.7,l=s.roofY!=null?s.roofY+.9:i;kt(r,t,n,e,Math.max(.5,l-n),.1,R.metal),kt(r,t+a,n,e,Math.max(.5,l-n),.1,R.metal);for(let h=n+.3;h<l-.15;h+=.32)r.addSpan(t,h,e-.02,t+a,h+.07,e+.12,R.metalLite);for(let h=n+3.5;h<l-1;h+=3.5)r.addSpan(t-.12,h,e-.12,t+a+.12,h+.08,e+.28,R.metal,"thin");const c=s.roofY!=null?s.roofY+1.6:i+.5;if(zl.add(t-.3,n,e-.4,t+a+.35,c,e+.5),s.roofY!=null&&s.roofX0!=null){const d=s.roofY+.02;r.addSpan(t-.15,d,e-.45,Math.max(t+.2,s.roofX0+.3),d+.1,e+.55,R.metalLite)}}function Mx(r,t,e,n,i,s,o,a){const l=t+n+.2,c=e+Math.min(i*.5,i-1)-.35,h=o*a,d=s+h,u=t+n*.15;xx(r,l,c,s,d,{roofY:d,roofX0:u}),r.addSpan(l-.3,s-.04,c-.5,l+.9,s+.08,c+.5,R.concrete)}function vx(r,t,e,n,i,s,o,a){const l=Math.min(n*.4,3.6),c=t+(n-l)/2,h=1.7,d=Math.max(6,Math.ceil(a/.38)),u=a/d,f=h/d,m=s;for(let _=0;_<d;_++){const p=m+(_+1)*u,g=e-.05-(_+1)*f,x=Math.max(e-h-.05,g),M=Math.min(e+.02,g+f);M-x<.06||r.addSpan(c,p-.12,x,c+l,p,M,R.concrete)}r.addSpan(c-.1,m+a,e-.15,c+l+.1,m+a+.12,e+.8,R.concrete),r.addSpan(c-.06,m+.15,e-h,c+.02,m+.95,e-.1,R.metal,"thin"),r.addSpan(c+l-.02,m+.15,e-h,c+l+.06,m+.95,e-.1,R.metal,"thin")}function yd(r,t,e,n,i,s,o,a,l=Math.random){const c=Math.min(3,Math.max(2.5,n*.22)),h=Math.min(3,Math.max(2.5,i*.22)),d=Math.max(3,Math.min(n,i)*.2);if(n<d*2+c+.5||i<d*2+h+.5)return null;const u=[[.5,.5],[.38,.5],[.62,.5],[.5,.38],[.5,.62],[.4,.4],[.6,.6]],[f,m]=u[Math.floor(l()*u.length)%u.length];let _=t+n*f-c/2,p=e+i*m-h/2;_=Math.max(t+d,Math.min(_,t+n-c-d)),p=Math.max(e+d,Math.min(p,e+i-h-d));const g=o*a,x=.18,M=Math.min(1.85,c-.45),y=2.55,A=.16,w=t+n*.5,E=e+i*.5,L=_+c/2,U=p+h/2,v=w-L,S=E-U;let I;Math.abs(S)>=Math.abs(v)?I=S>=0?"N":"S":I=v>=0?"E":"W";const D=_+(c-M)/2,F=D+M,q=p+(h-M)/2,O=q+M,z=(X,$,rt,J)=>{r.addSpan(X,s,$,rt,s+g,J,R.metalLite)};I!=="S"&&z(_,p,_+c,p+x),I!=="N"&&z(_,p+h-x,_+c,p+h),I!=="W"&&z(_,p,_+x,p+h),I!=="E"&&z(_+c-x,p,_+c,p+h);for(let X=0;X<o;X++){const $=s+X*a,rt=$+a,J=$+A-.08,st=Math.min(rt-.15,J+y);I==="S"?(r.addSpan(_,J,p,D,st,p+x,R.metalLite),r.addSpan(F,J,p,_+c,st,p+x,R.metalLite),r.addSpan(_,st,p,_+c,rt,p+x,R.metalLite)):I==="N"?(r.addSpan(_,J,p+h-x,D,st,p+h,R.metalLite),r.addSpan(F,J,p+h-x,_+c,st,p+h,R.metalLite),r.addSpan(_,st,p+h-x,_+c,rt,p+h,R.metalLite)):I==="W"?(r.addSpan(_,J,p,_+x,st,q,R.metalLite),r.addSpan(_,J,O,_+x,st,p+h,R.metalLite),r.addSpan(_,st,p,_+x,rt,p+h,R.metalLite)):(r.addSpan(_+c-x,J,p,_+c,st,q,R.metalLite),r.addSpan(_+c-x,J,O,_+c,st,p+h,R.metalLite),r.addSpan(_+c-x,st,p,_+c,rt,p+h,R.metalLite));const lt=1.5,ot=$+A;I==="S"?r.addSpan(_-.15,ot-.05,p-lt,_+c+.15,ot+.03,p-.02,R.concrete):I==="N"?r.addSpan(_-.15,ot-.05,p+h+.02,_+c+.15,ot+.03,p+h+lt,R.concrete):I==="W"?r.addSpan(_-lt,ot-.05,p-.15,_-.02,ot+.03,p+h+.15,R.concrete):r.addSpan(_+c+.02,ot-.05,p-.15,_+c+lt,ot+.03,p+h+.15,R.concrete);const wt=.2;I==="S"?(r.addSpan(F+.12,ot+.9,p-wt-.1,F+.28,ot+1.3,p-wt,R.metal),ve(r,F+.14,ot+1,p-wt-.08,F+.26,ot+1.15,p-wt-.02,R.neonLime)):I==="N"?r.addSpan(F+.12,ot+.9,p+h+wt,F+.28,ot+1.3,p+h+wt+.1,R.metal):I==="W"?r.addSpan(_-wt-.1,ot+.9,O+.12,_-wt,ot+1.3,O+.28,R.metal):r.addSpan(_+c+wt,ot+.9,O+.12,_+c+wt+.1,ot+1.3,O+.28,R.metal)}const G=.12;Gl.register({x0:_+G,z0:p+G,x1:_+c-G,z1:p+h-G,baseY:s,floors:o,floorH:a,deck:A,startFloor:0,doorFace:I});const et=1.55;let K=_-.08,j=p-.08,pt=_+c+.08,It=p+h+.08;return I==="S"?j=p-et:I==="N"?It=p+h+et:I==="W"?K=_-et:pt=_+c+et,{x0:K,z0:j,x1:pt,z1:It,ex:_,ez:p,ew:c,ed:h,face:I}}function yx(r,t,e,n,i,s,o,a,l){const _=6.300000000000001,p=.16,g=.16;let x=t+.5,M=e+.5;if(l){const lt=(l.x0+l.x1)*.5,ot=(l.z0+l.z1)*.5;lt<t+n*.5?x=t+n-3.62-.5:x=t+.5,ot<e+i*.5?M=e+i-_-.5:M=e+.5}else x=t+n-3.62-.5,M=e+i-_-.5;x=Math.max(t+.4,Math.min(x,t+n-3.62-.4)),M=Math.max(e+.4,Math.min(M,e+i-_-.4));const y=x+3.62,A=M+_,w=x+.12,E=w+1.55,L=y-.12,U=L-1.55,v=(x+y)*.5,S=(M+A)*.5,I=t+n*.5,D=e+i*.5,F=I-v,q=D-S,O=Math.abs(q)>=Math.abs(F)?q<0:!0,z=Math.abs(q)>=Math.abs(F)?q>=0:!1,G=Math.abs(F)>Math.abs(q)?F<0:!1,et=Math.abs(F)>Math.abs(q)?F>=0:!1,K=s+o*a,j=K+p,pt=lt=>lt>=o?j:s+lt*a+p,It=Math.max(11,Math.ceil(a/.3)),X=.14,$=M+1.55,rt=A-1.55,J=.28;for(let lt=0;lt<=o;lt++){const ot=pt(lt),wt=ot-g;r.addSpan(x,wt,M,y,ot,$,R.concrete),r.addSpan(x,wt,rt,y,ot,A,R.concrete);const Ct=1.7;(O||!z&&!et&&!G)&&r.addSpan(x-.15,wt,M-Ct,y+.15,ot,M+.08,R.concrete),z&&r.addSpan(x-.15,wt,A-.08,y+.15,ot,A+Ct,R.concrete),G&&r.addSpan(x-Ct,wt,M-.1,x+.08,ot,A+.1,R.concrete),et&&r.addSpan(y-.08,wt,M-.1,y+Ct,ot,A+.1,R.concrete)}for(let lt=0;lt<o;lt++){const ot=lt%2===0,wt=ot?w:U,Ct=ot?E:L,N=pt(lt),Yt=(pt(lt+1)-N)/It,Dt=ot?$-J:rt+J,Ot=((ot?rt+J:$-J)-Dt)/It;for(let C=0;C<It;C++){const T=N+(C+1)*Yt,V=Dt+C*Ot,Q=Dt+(C+1)*Ot,it=Math.min(V,Q),tt=Math.max(V,Q),Tt=.03;r.addSpan(wt,T-X,it-Tt,Ct,T,tt+Tt,R.concrete)}}r.addSpan(x,s+p,M,x+.04,K-.2,A,R.metal,"thin"),r.addSpan(y-.04,s+p,M,y,K-.2,A,R.metal,"thin");const st=1;return kt(r,x,j,M,st,.12,R.metalLite),kt(r,y-.12,j,M,st,.12,R.metalLite),kt(r,x,j,A-.12,st,.12,R.metalLite),kt(r,y-.12,j,A-.12,st,.12,R.metalLite),{x0:x-.06,z0:M-.06,x1:y+.06,z1:A+.06}}function Sd(r,t,e,n,i,s,o=null){const a=Math.min(3.4,Math.max(2.4,n*.28)),l=2.85,c=t+n*.5,h=c-a/2,d=e,u=s+.02;let f=s-.08;if(o!=null&&o.heightAt){const E=[o.heightAt(c,d-2.8),o.heightAt(c,d-1.5),o.heightAt(c-1.2,d-2.4),o.heightAt(c+1.2,d-2.4),o.heightAt(c,d-.4)];f=Math.min(...E.filter(L=>Number.isFinite(L))),Number.isFinite(f)||(f=s-.08)}f=Math.min(f,u-.04),f=Math.max(f,u-2.4);const m=Math.max(0,u-f),p=Math.max(1,Math.ceil(m/.2)),g=m/p,x=Math.min(.42,Math.max(.28,.55/Math.sqrt(p))),M=x*p+.15,y=d-M;r.addSpan(h-.55,f-.12,y-.1,h+a+.55,f+.04,d-.02,R.concrete);for(let E=0;E<p;E++){const L=f+(E+1)*g,U=f+E*g-.03,v=y+E*x,S=d-.04,I=E*.04;r.addSpan(h-.45+I,U,v,h+a+.45-I,L,S,R.concrete)}const A=.18,w=.28;r.addSpan(h-.18,u,d-.15,h+.05,u+l+.2,d+w,R.dark),r.addSpan(h+a-.05,u,d-.15,h+a+.18,u+l+.2,d+w,R.dark),r.addSpan(h-.18,u+l,d-.15,h+a+.18,u+l+.28,d+w,R.dark),r.addSpan(h-.9,u+l+.05,d-2.2,h+a+.9,u+l+.35,d+.35,R.metalLite),kt(r,h-.7,u,d-2,l+.1,.12,R.metal),kt(r,h+a+.55,u,d-2,l+.1,.12,R.metal),r.addSpan(h-.55,u+1.2,d-.15,h-.25,u+2.1,d+.1,R.glass),r.addSpan(h+a+.25,u+1.2,d-.15,h+a+.55,u+2.1,d+.1,R.glass),Hl.register({x:c,y:s,z:d-.06,width:a-.08,height:l,face:"S",thickness:A})}function Ed(r,t,e,n,i,s,o,a,l,c=-1,h=!0,d=null,u=!0){Sd(r,t,e,n,i,s,d);let f=null;if(h&&o>=3&&(f=yd(r,t,e,n,i,s,o,a,l)),!u||c===3||o>=6)return f;let m=c;return m<0&&(o<=3&&l()>.75?m=2:l()>.55?m=3:m=Math.floor(l()*2)),m===0?_x(r,t,e,n,i,s,o,a):m===1?Mx(r,t,e,n,i,s,o,a):m===2&&vx(r,t,e,n,i,s,o,a),f}function hl(r,t,e,n,i,s=null,o=null){const a=Math.min(24,s??8+Math.floor(i()*16)),l=3.5,c=a*l,h=12+i()*10,d=12+i()*10,u=we(i,[R.glass,R.glassDark,4872296,2766920,R.white,6979728,3819600,13160664]),f=we(i,[R.glassDark,R.metal,1714224,R.white]),m=n-.06,_=.35;r.addSpan(t-.35,n-.55,e-.35,t+h+.35,m+.1,e+d+.35,R.concrete);const p=a>=3?yd(r,t,e,h,d,m,a,l,i):null,g=Math.min(3.4,Math.max(2.4,h*.28)),x=t+h*.5,M=2.9,y=.95,A=2.35,w=.35,E=(O,z,G,et,K,j)=>{r.addSpan(O,G,K,O+w,et,j,u),r.addSpan(z-w,G,K,z,et,j,u),r.addSpan(O+w,G,Math.min(K,j),z-w,G+.08,Math.max(K,j),u),r.addSpan(O+w,et-.08,Math.min(K,j),z-w,et,Math.max(K,j),u),r.addSpan(O+w,G+.08,Math.min(K,j),z-w,et-.08,Math.max(K,j),R.glass,"glass")},L=(O,z,G,et,K,j)=>{r.addSpan(K,G,O,j,et,O+w,u),r.addSpan(K,G,z-w,j,et,z,u),r.addSpan(Math.min(K,j),G,O+w,Math.max(K,j),G+.08,z-w,u),r.addSpan(Math.min(K,j),et-.08,O+w,Math.max(K,j),et,z-w,u),r.addSpan(Math.min(K,j),G+.08,O+w,Math.max(K,j),et-.08,z-w,R.glass,"glass")};for(let O=0;O<a;O++){const z=m+O*l,G=z+l,et=O===0,K=z+y,j=z+A;et?(r.addSpan(t,z,e,x-g/2,G,e+_,u),r.addSpan(x+g/2,z,e,t+h,G,e+_,u),r.addSpan(x-g/2,z+M,e,x+g/2,G,e+_,u),E(t+.3,x-g/2-.15,K,j,e,e+_*.55),E(x+g/2+.15,t+h-.3,K,j,e,e+_*.55)):(r.addSpan(t,z,e,t+h,K,e+_,u),r.addSpan(t,j,e,t+h,G,e+_,u),E(t,t+h,K,j,e,e+_*.55)),r.addSpan(t,z,e+d-_,t+h,K,e+d,u),r.addSpan(t,j,e+d-_,t+h,G,e+d,u),E(t,t+h,K,j,e+d-_,e+d-_*.45),r.addSpan(t,z,e,t+_,K,e+d,u),r.addSpan(t,j,e,t+_,G,e+d,u),L(e+.4,e+d-.4,K,j,t,t+_*.55),r.addSpan(t+h-_,z,e,t+h,K,e+d,u),r.addSpan(t+h-_,j,e,t+h,G,e+d,u),L(e+.4,e+d-.4,K,j,t+h-_,t+h-_*.45)}const U=Math.floor(i()*3);if(U===1)r.addSpan(t-1,m,e+1.5,t-.05,m+l*2.2,e+d-.5,R.concrete),r.addSpan(t+h+.05,m,e+1.5,t+h+1,m+l*2.2,e+d-.5,R.concrete),r.addSpan(t-.5,m,e+d-.1,t+h+.5,m+l*2.2,e+d+1,R.concrete);else if(U===2&&a>10){const O=m+c*.75,z=Math.min(h,d)*.1,G=.4,et=t+z,K=t+h-z,j=e+z,pt=e+d-z;r.addSpan(et,O,j,K,m+c,j+G,f),r.addSpan(et,O,pt-G,K,m+c,pt,f),r.addSpan(et,O,j,et+G,m+c,pt,f),r.addSpan(K-G,O,j,K,m+c,pt,f)}const v=yx(r,t,e,h,d,m,a,l,p),S=[];p&&S.push({x0:p.x0,z0:p.z0,x1:p.x1,z1:p.z1}),v&&S.push(v),Vi(r,t+_,e+_,t+h-_,e+d-_,m+.18,R.concrete,S);for(let O=1;O<a;O++){const z=m+O*l;Vi(r,t+_*.5,e+_*.5,t+h-_*.5,e+d-_*.5,z+.16,R.concrete,S)}const I=m+c;Vi(r,t+_,e+_,t+h-_,e+d-_,I+.16,R.concrete,v);for(let O=2;O<a;O+=2){const z=m+O*l;r.addSpan(t-.04,z,e-.04,t+h+.04,z+.1,e+.08,f),r.addSpan(t-.04,z,e+d-.08,t+h+.04,z+.1,e+d+.04,f)}Sd(r,t,e,h,d,m,o),r.addSpan(t+h*.08,I+.16,e+d*.08,t+h*.96,I+.55,e+d*.08+.2,R.concrete),r.addSpan(t+h*.08,I+.16,e+d*.92-.2,t+h*.96,I+.55,e+d*.92,R.concrete),r.addSpan(t+h*.08,I+.16,e+d*.08,t+h*.08+.2,I+.55,e+d*.92,R.concrete);const D=e+d*.4,F=e+d*.6;r.addSpan(t+h*.96-.2,I+.16,e+d*.08,t+h*.96,I+.55,D,R.concrete),r.addSpan(t+h*.96-.2,I+.16,F,t+h*.96,I+.55,e+d*.92,R.concrete),r.addSpan(t+h*.35,I+.16,e+d*.35,t+h*.65,I+1.4,e+d*.65,R.metal),a>=16&&i()>.82&&(kt(r,t+h/2-.25,I+1.4,e+d/2-.25,10+i()*12,.5,R.metalLite),ve(r,t+h/2-.4,I+12,e+d/2-.4,t+h/2+.4,I+14,e+d/2+.4,R.redHot));const q=[];for(let O=0;O<a;O++)q.push(m+(O===0?.2:O*l+.18));return xd({x:t,z:e,w:h,d,floors:a,baseY:m,floorYs:q,roofY:I}),{w:h+2.2,d:d+1,h:c,floors:a,x:t,z:e}}function Sx(r,t,e,n,i,s,o=null){const a=o||new Bl(12),l=6,c=5,h=12,d=32,u=30,f=d+h,m=u+h,_=e-(l*f-h)/2,p=n-(c*m-h)/2,g=(A,w,E=0,L=0)=>Md(t,A,w,E,L),x=2.8,M=new Set(["0,0","5,4"]);let y=0;for(let A=0;A<c;A++)for(let w=0;w<l;w++){const E=_+w*f,L=p+A*m,U=g(E+2,L+2,d-4,u-4);if(U==null||U<x)continue;const v=U,S=E-1.2,I=L-1.2,D=t.heightAt(S,I);if(D>=x){const ot=D-.08;kt(r,S,ot,I,5.5,.16,R.metal),r.addSpan(S-.25,ot+5.25,I-.25,S+.35,ot+5.55,I+.35,15791352),r.addSpan(S-.2,ot,I-.2,S+.3,ot+.12,I+.3,R.concrete)}if(M.has(`${w},${A}`)){const ot=E+3,wt=L+3,Ct=d-6,N=u-6;a.tryClaim(ot,wt,Ct,N,1);for(let Ee=0;Ee<5;Ee++){const Xt=ot+2+Ee%3*6,Yt=wt+3+Math.floor(Ee/3)*10;Xt+5>ot+Ct||Yt+2.5>wt+N||s()>.4&&Bs(r,Xt,Yt,v,s)}continue}const F=Math.hypot(w-l*.45,A-c*.4),q=A>=c-2,O=F<2,z=5,G=d-z*2,et=u-z*2,K=Math.min(G,12+s()*10),j=Math.min(et,12+s()*10),pt=z+(G-K)*.35+s()*Math.max(.2,(G-K)*.3),It=z+(et-j)*.35+s()*Math.max(.2,(et-j)*.3),X=E+pt,$=L+It;if(!a.tryClaim(X-1,$-1,K+4,j+3,1.5))continue;const rt=ll(t,X,$,K,j);if(!Number.isFinite(rt.max)||rt.max<x||rt.delta>2.2)continue;const J=rt.max;let st;O&&s()>.2?st=16+Math.floor(s()*10):q&&s()>.3?st=12+Math.floor(s()*8):s()>.45?st=9+Math.floor(s()*8):st=5+Math.floor(s()*5);const lt=Math.min(rt.min,J)-.2;if(r.addSpan(X-.25,lt,$-.25,X+K+.25,J+.06,$+j+.25,R.concrete),st<=7){const ot=J-.05;Ne(r,{x:X,z:$,w:K,d:j,floors:st,baseY:ot,color:we(s,[R.glass,R.white,R.cream,R.brick,R.gray]),rng:s}),Ed(r,X,$,K,j,ot,st,te.FLOOR_HEIGHT,s,3,!1,t,!1)}else hl(r,X,$,J,s,st,t);y++}for(let A=0;A<4;A++){const w=_+18+A*42,E=p+c*m+12,L=16,U=14;if(!a.tryClaim(w,E,L+3,U+1,3))continue;const v=ll(t,w,E,L,U);if(!Number.isFinite(v.max)||v.max<x||v.delta>2.5)continue;const S=v.max;r.addSpan(w-.3,v.min-.25,E-.3,w+L+.3,S+.06,E+U+.3,R.concrete),hl(r,w,E,S,s,12+Math.floor(s()*6),t),y++}return{towers:y,cols:l,rows:c,occ:a}}function rr(r,t,e,n,i){const s=Math.max(.5,mn(t,e,n,16,12));He(r,{x:e,z:n,w:14,d:10,h:4.5,baseY:s,color:R.wood,doorW:5}),ve(r,e,s+3.8,n-.1,e+14,s+4.3,n+.15,R.teal);const o=22+i()*14;r.addSpan(e-o,Math.max(.35,s-.15),n+1.5,e,Math.max(.65,s+.2),n+8.5,R.wood),ve(r,e-o,s+.15,n+1.4,e,s+.35,n+1.7,R.woodDark);for(let a=0;a<7;a++){const l=e-2-a*3.5;kt(r,l,-3,n+1.8,s+3.2,.45,R.dark),kt(r,l,-3,n+7.2,s+3.2,.45,R.dark)}r.addSpan(e-o+4,.2,n+9,e-o+11,1.1,n+12.5,we(i,[R.white,R.blueLite,R.red])),r.addSpan(e-o+5,1,n+9.5,e-o+9,1.8,n+11.8,R.glassDark)}function ha(r,t,e,n,i){const s=Math.max(.55,mn(t,e,n,50,16)),o=55,a=14;r.addSpan(e,s,n,e+o,s+.45,n+a,R.wood),ve(r,e,s+.45,n,e+o,s+.7,n+.4,R.woodDark),ve(r,e,s+.45,n+a-.4,e+o,s+.7,n+a,R.woodDark);for(let l=0;l<12;l++){const c=e+2+l*4.5;kt(r,c,-4,n+.8,s+4.5,.5,R.dark),kt(r,c,-4,n+a-1.4,s+4.5,.5,R.dark)}for(let l=0;l<8;l++){const c=e+3+l%4*7,h=n+2+Math.floor(l/4)*5,d=1+Math.floor(i()*3),u=we(i,[R.blue,R.orange,R.teal,R.red,R.yellow,R.green]);for(let f=0;f<d;f++)r.addSpan(c,s+.45+f*2.6,h,c+6.1,s+.45+(f+1)*2.6,h+2.5,u)}kt(r,e+30,s,n+5,18,.8,R.yellowHot),r.addSpan(e+30,s+17,n+2,e+48,s+18,n+10,R.yellow),kt(r,e+46,s+8,n+5.5,10,.3,R.metal),He(r,{x:e+o-4,z:n-4,w:20,d:18,h:9,baseY:mn(t,e+o,n,20,18),color:R.metal,doorW:7}),vd(r,e+o-10,n+a+2,s,i)}function da(r,t,e,n,i,s,o,a=14){const l=Math.min(e,i),c=Math.max(e,i),h=Math.min(n,s),d=Math.max(n,s);if(c-l>=d-h){const f=(h+d)/2;r.addSpan(l,o,f-a/2,c,o+.6,f+a/2,R.asphalt),r.addSpan(l,o+.6,f-a/2,c,o+1.7,f-a/2+.35,R.metalLite,"thin"),r.addSpan(l,o+.6,f+a/2-.35,c,o+1.7,f+a/2,R.metalLite,"thin");const m=c-l,_=Math.max(3,Math.floor(m/28));for(let p=0;p<=_;p++){const g=l+m*p/_;r.addSpan(g-1.6,-5,f-2.5,g+1.6,o,f+2.5,R.concrete),kt(r,g-.2,o,f-a/2+.2,8+Math.sin(p)*2,.4,R.metalLite),kt(r,g-.2,o,f+a/2-.6,8+Math.sin(p)*2,.4,R.metalLite)}}else{const f=(l+c)/2;r.addSpan(f-a/2,o,h,f+a/2,o+.6,d,R.asphalt),r.addSpan(f-a/2,o+.6,h,f-a/2+.35,o+1.7,d,R.metalLite,"thin"),r.addSpan(f+a/2-.35,o+.6,h,f+a/2,o+1.7,d,R.metalLite,"thin");const m=d-h,_=Math.max(3,Math.floor(m/28));for(let p=0;p<=_;p++){const g=h+m*p/_;r.addSpan(f-2.5,-5,g-1.6,f+2.5,o,g+1.6,R.concrete),kt(r,f-a/2+.2,o,g-.2,8,.4,R.metalLite),kt(r,f+a/2-.6,o,g-.2,8,.4,R.metalLite)}}}function Ex(r,t,e,n,i,s=null){const o={large:{body:[3.2,1.8,1.4],head:[1,.9,.9],leg:.9,color:[9068608,12886112,5913120,13676672],accent:3811344},tall:{body:[1.5,3.2,1.1],head:[.8,.7,1.1],leg:1.6,color:[14729328,12886096],accent:9072688},bulk:{body:[3.6,2.1,1.8],head:[1.2,1,1],leg:.7,color:[6974058,3815994,9079434],accent:1710618},small:{body:[1.4,.9,.8],head:[.5,.45,.5],leg:.35,color:[12615744,15782048,4861984,15261904],accent:2759184},bird:{body:[.9,.7,.55],head:[.4,.4,.4],leg:.5,color:[15790320,2779802,14696480,4243520],accent:16764992},long:{body:[4,1.2,1],head:[.9,.7,.7],leg:.55,color:[3836490,2775600],accent:1716248}},a=Object.keys(o),l=o[s]||o[we(i,a)],c=we(i,l.color),[h,d,u]=l.body,[f,m,_]=l.head;for(const[p,g]of[[.2,.2],[h-.45,.2],[.2,u-.45],[h-.45,u-.45]])r.addSpan(t+p,n,e+g,t+p+.28,n+l.leg,e+g+.28,l.accent);r.addSpan(t,n+l.leg*.7,e,t+h,n+l.leg*.7+d,e+u,c),r.addSpan(t+h-f*.15,n+l.leg*.7+d*.55,e+u*.15,t+h+f*.75,n+l.leg*.7+d*.55+m,e+u*.15+_,c),r.addSpan(t+h+f*.55,n+l.leg*.7+d*.6,e+u*.25,t+h+f*1.1,n+l.leg*.7+d*.6+m*.4,e+u*.25+_*.5,l.accent),(s==="large"||s==="tall")&&(kt(r,t+h+.1,n+l.leg*.7+d*.9,e+u*.2,.6,.15,l.accent),kt(r,t+h+.1,n+l.leg*.7+d*.9,e+u*.55,.6,.15,l.accent)),s==="bird"&&(r.addSpan(t-.5,n+l.leg*.7+.2,e+.1,t+.2,n+l.leg*.7+.5,e+u-.1,c),r.addSpan(t+h-.2,n+l.leg*.7+.2,e+.1,t+h+.5,n+l.leg*.7+.5,e+u-.1,c))}function us(r,t,e,n,i){const s=mn(t,e,n),o=9+i()*4;kt(r,e,s,n,o,.55,R.metal),kt(r,e+.1,s,n+3.5,o,.55,R.metal);const a=we(i,[R.redHot,R.blue,R.yellowHot,R.teal,R.neonPink,R.orange,R.neonLime]);r.addSpan(e-3.5,s+o-.3,n-.3,e+4.2,s+o+3.2,n+4.2,a),ve(r,e-3.4,s+o+2.8,n-.2,e+4.1,s+o+3.15,n+4.1,R.neonCyan),r.addSpan(e-1,s+o-.5,n+.5,e+2,s+o-.2,n+3.2,R.metalLite)}const Wn=te.PALETTE,Ls=new Bl(10);function Tx(){Ls.rects.length=0,Ls.buckets.clear(),rx()}function Un(r){return pn.find(t=>t.id===r)}function Xe(r,t,e,n,i=0,s=0){let o=r.heightAt(e,n);if(i||s){const a=[[0,0],[1,0],[0,1],[1,1],[.5,0],[.5,1],[0,.5],[1,.5],[.5,.5],[.25,.25],[.75,.75]];for(const[l,c]of a)o=Math.max(o,r.heightAt(e+i*l,n+s*c))}return o}function On(r,t){return t[Math.floor(r()*t.length)%t.length]}function Ax(r,t,e){const n=Un("downtown"),i=new Bl(12);Sx(r,t,n.x,n.z,null,e,i);for(const s of i.rects)Ls.claim(s.x0,s.z0,s.x1-s.x0,s.z1-s.z0,0,!0)}function wx(r,t,e){const n=Un("airport");for(let u=0;u<4;u++){const _=n.x-90+u*55,p=n.z-48;He(r,{x:_,z:p,w:50,d:26,h:12,baseY:Xe(t,n,_,p,50,26),color:On(e,[9078912,8881535,10131084])})}const i=n.x-70,s=n.z+30;Ne(r,{x:i,z:s,w:22,d:16,floors:3,baseY:Xe(t,n,i,s,22,16),color:Wn[0],rng:e});const o=6.06,a=2.59,l=2.44,c=n.x+10,h=n.z+20,d=[4877178,8014396,7044931,9078912];for(let u=0;u<4;u++)for(let f=0;f<6;f++){const m=c+f*(o+2.2),_=h+u*(l+3.4),p=Xe(t,n,m,_,o,l),g=e()>.55?2:1;for(let x=0;x<g;x++)r.addSpan(m,p+x*a,_,m+o,p+(x+1)*a,_+l,d[(u+f+x)%d.length]);if(e()>.35){const x=m+e()*(o-1.6);r.addSpan(x,p,_-1.7,x+1.5,p+1.45,_-.2,9337434)}}}function bx(r,t,e){const n=Un("mcrd"),i=Xe(t,n,n.x,n.z,24,24);for(let s=0;s<3;s++)for(let o=0;o<4;o++){const a=n.x-55+o*30,l=n.z-45+s*28;Ne(r,{x:a,z:l,w:24,d:12,floors:2,baseY:i,color:On(e,[7035203,9078912,8881535]),rng:e})}Ne(r,{x:n.x-14,z:n.z+50,w:28,d:18,floors:3,baseY:i,color:8881535,rng:e});for(let s=0;s<16;s++){const o=n.x-70+s*9;r.addSpan(o,i,n.z+72,o+7.5,i+1.15,n.z+72.35,7236712,"thin")}for(let s=0;s<8;s++){const o=n.x-40+s*11;r.addSpan(o,i,n.z+8,o+2.2,i+1.5,n.z+10,6054246)}}function Rx(r,t,e){const n=Un("pointloma"),i=Xe(t,n,n.x,n.z,24,24);Ne(r,{x:n.x-6,z:n.z-6,w:12,d:12,floors:4,baseY:i,color:Wn[4],rng:e});const s=i+te.GROUND_FLOOR_HEIGHT+3*te.FLOOR_HEIGHT;r.addSpan(n.x-.6,s,n.z-.6,n.x+.6,s+18,n.z+.6,10131084);for(let o=0;o<6;o++){const a=o/6*Math.PI*1.7+.3,l=24+o%2*16,c=14,h=10,d=n.x+Math.cos(a)*l-c/2,u=n.z+Math.sin(a)*l-h/2;Ne(r,{x:d,z:u,w:c,d:h,floors:1+Math.floor(e()*2),baseY:Xe(t,n,d,u,c,h),color:On(e,Wn),rng:e})}for(let o=0;o<10;o++){const a=n.x-50+o*10;r.addSpan(a,i,n.z+48,a+8,i+1.2,n.z+48.35,10131084,"thin")}}function Cx(r,t,e){const n=Un("missionvalley"),i=Xe(t,n,n.x,n.z,24,24);He(r,{x:n.x-70,z:n.z-30,w:55,d:32,h:14,baseY:i,color:9078912,doorW:8}),He(r,{x:n.x+10,z:n.z-24,w:48,d:28,h:12,baseY:i,color:10131084,doorW:6});for(let s=0;s<3;s++)Ne(r,{x:n.x-50+s*40,z:n.z+30,w:20,d:16,floors:4+Math.floor(e()*3),baseY:i,color:On(e,Wn),rng:e});for(let s=0;s<12;s++){const o=n.x-60+s%6*22,a=n.z+55+Math.floor(s/6)*14;r.addSpan(o,i,a,o+4.8,i+1.5,a+2,6054246)}}function Px(r,t,e){const n=Un("kearnymesa"),i=Xe(t,n,n.x,n.z,24,24);for(let s=0;s<3;s++)for(let o=0;o<3;o++){const a=n.x-50+o*38,l=n.z-45+s*36;e()>.45?He(r,{x:a,z:l,w:28+e()*8,d:20+e()*6,h:8+e()*4,baseY:i,color:On(e,[8881535,7035203,9078912]),doorW:5}):Ne(r,{x:a,z:l,w:22,d:16,floors:2+Math.floor(e()*3),baseY:i,color:On(e,Wn),rng:e})}for(let s=0;s<6;s++){const o=n.x-40+s*16;r.addSpan(o,i,n.z+55,o+3.2,i+2.4,n.z+57.5,6054246)}}function Lx(r,t,e){const n=Un("balboa"),i=Xe(t,n,n.x,n.z,24,24);He(r,{x:n.x-40,z:n.z-28,w:48,d:26,h:14,baseY:i,color:10131084,doorW:6}),He(r,{x:n.x+20,z:n.z-20,w:36,d:22,h:12,baseY:i,color:9078912,doorW:5});for(let s=0;s<3;s++)Ne(r,{x:n.x-50+s*42,z:n.z+18,w:22,d:16,floors:2+(s===1?1:0),baseY:i,color:On(e,Wn),rng:e});for(let s=0;s<14;s++){const o=n.x-55+s*8;r.addSpan(o,i,n.z+48,o+6.5,i+1.15,n.z+48.3,8881535,"thin")}}function Ix(r,t,e){const n=Un("zoo"),i=Xe(t,n,n.x,n.z,24,24);He(r,{x:n.x-20,z:n.z-30,w:40,d:24,h:11,baseY:i,color:7044931,doorW:6});for(let s=0;s<8;s++){const o=s/8*Math.PI*2,a=28+s%3*10,l=12+e()*6,c=10+e()*4,h=n.x+Math.cos(o)*a-l/2,d=n.z+Math.sin(o)*a-c/2;He(r,{x:h,z:d,w:l,d:c,h:4+e()*3,baseY:Xe(t,n,h,d,l,c),color:On(e,[7044931,9079634,8014396,9078912]),doorW:2.5})}Ne(r,{x:n.x-8,z:n.z+8,w:16,d:14,floors:2,baseY:i,color:Wn[5],rng:e});for(let s=0;s<20;s++){const o=s/20*Math.PI*2,a=42,l=n.x+Math.cos(o)*a,c=n.z+Math.sin(o)*a,h=n.x+Math.cos(o+.25)*a,d=n.z+Math.sin(o+.25)*a,u=Math.min(l,h),f=Math.max(l,h),m=Math.min(c,d),_=Math.max(c,d);r.addSpan(u,i,m,Math.max(u+1.2,f),i+1.3,Math.max(m+.5,_),7035203,"thin")}}function Dx(r,t,e){const n=Un("coronado"),i=Xe(t,n,n.x,n.z,24,24);Ne(r,{x:n.x-30,z:n.z-16,w:40,d:24,floors:5,baseY:i,color:10131084,rng:e}),Ne(r,{x:n.x+18,z:n.z-12,w:24,d:18,floors:3,baseY:i,color:Wn[5],rng:e});for(let s=0;s<7;s++)He(r,{x:n.x-45+s*14,z:n.z+24,w:10,d:7,h:3.4,baseY:i,color:On(e,Wn)});for(let s=0;s<12;s++){const o=n.x-50+s*9;r.addSpan(o,i,n.z+42,o+7.5,i+1.1,n.z+42.35,10131084,"thin")}}function Nx(r,t,e){const n=Un("lajolla"),i=Xe(t,n,n.x,n.z,24,24);for(let s=0;s<7;s++){const o=s/7*Math.PI*1.5-.3,a=18+s%3*14,l=12+e()*5,c=10+e()*4,h=n.x+Math.cos(o)*a-l/2,d=n.z+Math.sin(o)*a-c/2;Ne(r,{x:h,z:d,w:l,d:c,floors:1+Math.floor(e()*3),baseY:Xe(t,n,h,d,l,c),color:On(e,Wn),rng:e})}He(r,{x:n.x-8,z:n.z+20,w:18,d:12,h:5,baseY:i,color:9412776,doorW:3});for(let s=0;s<10;s++){const o=n.x-45+s*9;r.addSpan(o,i,n.z+42,o+7,i+1.15,n.z+42.3,10131084,"thin")}}function Ox(r,t,e){const n=Un("radiotower"),i=Xe(t,n,n.x-5,n.z-5,12,12),s=12,o=12,a=n.x-s/2,l=n.z-o/2;Ne(r,{x:a,z:l,w:s,d:o,floors:3,baseY:i,color:7236712,rng:e});const c=i+te.GROUND_FLOOR_HEIGHT+2*te.FLOOR_HEIGHT;r.addSpan(n.x-.7,c,n.z-.7,n.x+.7,c+36,n.z+.7,9078912),r.addSpan(n.x-4,c+28,n.z-.35,n.x+4,c+29.2,n.z+.35,7236712),r.addSpan(n.x-.35,c+22,n.z-3.5,n.x+.35,c+23.2,n.z+3.5,7236712),r.addSpan(n.x-.9,c+36,n.z-.9,n.x+.9,c+38.5,n.z+.9,12864060);for(let h=0;h<4;h++){const d=h/4*Math.PI*2+.4,u=28,f=10,m=8,_=n.x+Math.cos(d)*u-f/2,p=n.z+Math.sin(d)*u-m/2;He(r,{x:_,z:p,w:f,d:m,h:4.5,baseY:Xe(t,n,_,p,f,m),color:On(e,[7236712,8881535,6118232])})}for(let h=0;h<5;h++){const d=n.x-18+h*9;r.addSpan(d,i,n.z+16,d+2.8,i+2.2,n.z+18.5,6054246)}for(let h=0;h<12;h++){const d=h/12*Math.PI*2,u=38,f=n.x+Math.cos(d)*u,m=n.z+Math.sin(d)*u,_=n.x+Math.cos(d+.4)*u,p=n.z+Math.sin(d+.4)*u,g=Math.min(f,_),x=Math.max(f,_),M=Math.min(m,p),y=Math.max(m,p);r.addSpan(g,i,M,Math.max(g+1,x),i+1.25,Math.max(M+.45,y),9337434,"thin")}}function Ux(r,t,e){var n;Tx(),zl.clear(),Hl.clear(),Gl.clear(),t.roadLines&&K_(Ls,t.roadLines),Ax(r,t,e),wx(r,t,e),bx(r,t,e),Rx(r,t,e),Cx(r,t,e),Px(r,t,e),Lx(r,t,e),Ix(r,t,e),Dx(r,t,e),Ox(r,t,e),Nx(r,t,e),t.roadLines&&J_(r,t,t.roadLines),(n=t.parkingLots)!=null&&n.length&&Z_(r,t,t.parkingLots,e,Bs,Ls)}const Fx=90;function Eo(r,t,e,n=1){const i=(r.near??Fx)*n;return Math.hypot(t-r.x,e-r.z)<=i}function Td(r,t,e){let n=null,i=1/0;for(const s of r){const o=Math.hypot(t-s.x,e-s.z);o<i&&(i=o,n=s)}return{poi:n,dist:i}}const ua=Object.keys(Hi.TYPES);class Bx{constructor(t,e){this.cell=e,this.dim=Math.ceil(t/e),this.half=t/2,this.buckets=new Map}_key(t,e){return t*73856093^e*19349663}tooClose(t,e,n){const i=Math.floor((t+this.half)/this.cell),s=Math.floor((e+this.half)/this.cell),o=n*n;for(let a=s-1;a<=s+1;a++)for(let l=i-1;l<=i+1;l++){const c=this.buckets.get(this._key(l,a));if(c)for(let h=0;h<c.length;h+=2){const d=c[h]-t,u=c[h+1]-e;if(d*d+u*u<o)return!0}}return!1}insert(t,e){const n=Math.floor((t+this.half)/this.cell),i=Math.floor((e+this.half)/this.cell),s=this._key(n,i);let o=this.buckets.get(s);o||(o=[],this.buckets.set(s,o)),o.push(t,e)}}function zx(r,t,e){const n=new Bx(dt.SIZE,Hi.MIN_SPACING),i=dt.SIZE/2-40;let s=0,o=0;const a=Hi.COUNT*220;for(;s<Hi.COUNT&&o<a;){o++;const l=(e()*2-1)*i,c=(e()*2-1)*i;if(t.heightAt(l,c)<2.5||t.slopeDegAt(l,c)>28||t.roadAt(l,c)>.25)continue;let d=!1;for(const x of pn)if(Eo(x,l,c,.7)){d=!0;break}if(d&&e()>Hi.POI_BIAS||n.tooClose(l,c,Hi.MIN_SPACING))continue;const u=ua[Math.floor(e()*ua.length)%ua.length],f=Hi.TYPES[u];let m=ie(f.min[0],f.max[0],e());const _=ie(f.min[1],f.max[1],e());let p=ie(f.min[2],f.max[2],e());if(e()>.5){const x=m;m=p,p=x}const g=t.heightAt(l,c)-_*.06;r.add(l,g+_/2,c,m,_,p,f.color),n.insert(l,c),s++}return{placed:s,attempts:o}}function xi(r,t,e=.85){for(const n of pn)if(Eo(n,r,t,e))return!0;return!1}function En(r,t,e=18,n=16){return Ls.tryClaim(r,t,e,n,2.5)}function An(r){return pn.find(t=>t.id===r)}function Fn(r,t,e,n,i){const s=dt.SIZE/2-50;for(let o=0;o<e;o++){const a=(t()*2-1)*s,l=(t()*2-1)*s;if(n(a,l,r))return i(a,l),!0}return!1}function ni(r,t,e,n=22){var s;const i=r.heightAt(t,e);return!(i<3||i>90||r.slopeDegAt(t,e)>n||r.roadAt(t,e)>.2||r.downtownPlateY!=null&&((s=r.onDowntownPlate)!=null&&s.call(r,t,e))&&i<r.downtownPlateY-1.2)}function Hx(r,t,e){const n=al,i={suburban:0,trailer:0,gas:0,restaurant:0,auto:0,fire:0,business:0,sky:0,boat:0,billboard:0,animal:0,vehicle:0};for(let o=0;o<n.SUBURBAN&&Fn(t,e,80,(l,c,h)=>!(!ni(h,l,c,18)||xi(l,c,.9)||c>380&&Math.abs(l)<150||l>450),(l,c)=>{En(l,c,16,14)&&(mx(r,t,l,c,e),i.suburban++)});o++);for(let o=0;o<n.TRAILER;o++)Fn(t,e,60,(a,l,c)=>{if(!ni(c,a,l,16)||xi(a,l,.85))return!1;const h=c.heightAt(a,l);return h>4&&h<35},(a,l)=>{const c=3+Math.floor(e()*3);for(let h=0;h<c;h++){const d=a+h%3*16,u=l+Math.floor(h/3)*12;En(d,u,14,6)&&(gx(r,t,d,u,e),i.trailer++)}});for(let o=0;o<n.GAS;o++)Fn(t,e,100,(a,l,c)=>{if(!ni(c,a,l,14)||xi(a,l,1))return!1;let h=c.roadAt(a,l)>.05;for(let d=0;d<8&&!h;d++){const u=d/8*Math.PI*2;c.roadAt(a+Math.cos(u)*18,l+Math.sin(u)*18)>.15&&(h=!0)}return h},(a,l)=>{En(a,l,28,24)&&(ir(r,t,a,l),i.gas++)});for(let o=0;o<n.RESTAURANT;o++)Fn(t,e,70,(a,l,c)=>!ni(c,a,l,16)||xi(a,l,.8)?!1:c.heightAt(a,l)<50,(a,l)=>{En(a,l,22,18)&&(Tn(r,t,a,l,e,e()>.35),i.restaurant++)});for(let o=0;o<n.AUTO;o++)Fn(t,e,60,(a,l,c)=>ni(c,a,l,16)&&!xi(a,l,.85)&&c.heightAt(a,l)<55,(a,l)=>{En(a,l,24,20)&&(cl(r,t,a,l,e),i.auto++)});for(let o=0;o<n.FIRE;o++)Fn(t,e,80,(a,l,c)=>ni(c,a,l,14)&&!xi(a,l,1),(a,l)=>{En(a,l,36,24)&&(sr(r,t,a,l,e),i.fire++)});for(let o=0;o<n.BUSINESS;o++)Fn(t,e,70,(a,l,c)=>!ni(c,a,l,14)||xi(a,l,.7)?!1:Math.abs(a)<280&&l>-200&&l<400||a>50&&a<250&&l<-100,(a,l)=>{En(a,l,28,24)&&(ds(r,t,a,l,e),i.business++)});const s=An("downtown");if(s){let o=0;for(;i.sky<n.SKY&&o<n.SKY*40;){o++;const a=e()*Math.PI*2,l=100+e()*160,c=s.x+Math.cos(a)*l,h=s.z+Math.sin(a)*l;if(t.heightAt(c,h)<3||t.slopeDegAt(c,h)>16||t.roadAt(c,h)>.25||!En(c-8,h-8,20,18))continue;const d=[t.heightAt(c,h),t.heightAt(c+14,h),t.heightAt(c,h+14),t.heightAt(c+14,h+14),t.heightAt(c+7,h+7)],u=Math.min(...d),f=Math.max(...d);if(f-u>1.25)continue;let m=f;t.downtownPlateY!=null&&(m=Math.max(m,t.downtownPlateY-.15)),hl(r,c-8,h-8,m,e,12+Math.floor(e()*12),t),i.sky++}}for(let o=0;o<n.BOAT;o++)Fn(t,e,90,(a,l,c)=>{const h=c.heightAt(a,l);return h<.5||h>12||c.slopeDegAt(a,l)>20?!1:c.heightAt(a-12,l)<1.5||c.heightAt(a,l+12)<1.5},(a,l)=>{En(a-20,l,30,14)&&(rr(r,t,a,l,e),i.boat++)});for(let o=0;o<n.BILLBOARD;o++)Fn(t,e,40,(a,l,c)=>ni(c,a,l,20)&&!xi(a,l,.5),(a,l)=>{En(a-2,l-2,8,6)&&(us(r,t,a,l,e),i.billboard++)});for(let o=0;o<n.VEHICLE;o++)Fn(t,e,50,(a,l,c)=>!ni(c,a,l,18)||c.roadAt(a,l)>.12?!1:c.roadAt(a+10,l)>.25||c.roadAt(a-10,l)>.25||c.roadAt(a,l+10)>.25||c.roadAt(a,l-10)>.25,(a,l)=>{En(a,l,5.2,2.4)&&(Bs(r,a,l,t.heightAt(a,l),e),i.vehicle++)});return Gx(r,t,e,i),i}function Gx(r,t,e,n){const i=An("airport");i&&(ha(r,t,i.x-90,i.z+40,e),ha(r,t,i.x-50,i.z+70,e));const s=An("coronado"),o=An("downtown");s&&o&&da(r,t,s.x+40,s.z-20,o.x-30,o.z+40,14,14);const a=An("missionvalley");a&&(da(r,t,a.x-80,a.z-30,a.x-80,a.z+50,16,12),da(r,t,a.x+90,a.z-40,a.x+90,a.z+45,15,12));const l=An("pointloma");l&&(rr(r,t,l.x+40,l.z+30,e),rr(r,t,l.x+55,l.z+55,e),n.boat+=2);const c=An("lajolla");c&&(rr(r,t,c.x+30,c.z+20,e),sr(r,t,c.x+50,c.z-10,e),n.fire++,n.boat++);const h=An("zoo");if(h){const m=["large","tall","bulk","small","bird","long","large","tall","small","bird","bulk","long"];for(let _=0;_<al.ANIMALS;_++){const p=_/al.ANIMALS*Math.PI*2+e()*.4,g=12+_%5*10+e()*8,x=h.x+Math.cos(p)*g,M=h.z+Math.sin(p)*g,y=t.heightAt(x,M);y<2||(Ex(r,x,M,y,e,m[_%m.length]),n.animal++)}for(let _=0;_<4;_++){const p=_/4*Math.PI*2;Tn(r,t,h.x+Math.cos(p)*55,h.z+Math.sin(p)*55,e,!0),n.restaurant++}}o&&(sr(r,t,o.x-80,o.z-50,e),ds(r,t,o.x+70,o.z-55,e),ds(r,t,o.x-60,o.z+50,e),ir(r,t,o.x-100,o.z+25),Tn(r,t,o.x+85,o.z+30,e,!0),Tn(r,t,o.x+40,o.z-70,e,!1),us(r,t,o.x-50,o.z+70,e),n.fire++,n.business+=2,n.gas++,n.restaurant+=2,n.billboard++);const d=An("balboa");d&&(Tn(r,t,d.x-40,d.z+50,e,!1),us(r,t,d.x+50,d.z-30,e),n.restaurant++,n.billboard++);const u=An("kearnymesa");u&&(ds(r,t,u.x+45,u.z+35,e),ds(r,t,u.x-55,u.z-25,e),cl(r,t,u.x-55,u.z+25,e),ir(r,t,u.x-35,u.z-55),Tn(r,t,u.x+60,u.z-45,e,!0),Tn(r,t,u.x+30,u.z+50,e,!0),sr(r,t,u.x+70,u.z+10,e),us(r,t,u.x-70,u.z+40,e),n.business+=2,n.auto++,n.gas++,n.restaurant+=2,n.fire++,n.billboard++),a&&(Tn(r,t,a.x+75,a.z+25,e,!0),Tn(r,t,a.x-75,a.z-20,e,!1),Tn(r,t,a.x+40,a.z-55,e,!0),ir(r,t,a.x+55,a.z-55),ds(r,t,a.x-90,a.z+30,e),us(r,t,a.x+100,a.z,e),n.restaurant+=3,n.gas++,n.business++,n.billboard++);const f=An("mcrd");f&&(sr(r,t,f.x+55,f.z-35,e),us(r,t,f.x-40,f.z+40,e),n.fire++,n.billboard++),i&&(cl(r,t,i.x+75,i.z-25,e),ir(r,t,i.x+40,i.z-60),ha(r,t,i.x-120,i.z+20,e),n.auto++,n.gas++),s&&(Tn(r,t,s.x+40,s.z-30,e,!1),rr(r,t,s.x-40,s.z+20,e),n.restaurant++,n.boat++)}function vh(r,t){if(t===hu)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(t===nl||t===Vh){let e=r.getIndex();if(e===null){const o=[],a=r.getAttribute("position");if(a!==void 0){for(let l=0;l<a.count;l++)o.push(l);r.setIndex(o),e=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}const n=e.count-2,i=[];if(t===nl)for(let o=1;o<=n;o++)i.push(e.getX(0)),i.push(e.getX(o)),i.push(e.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(i.push(e.getX(o)),i.push(e.getX(o+1)),i.push(e.getX(o+2))):(i.push(e.getX(o+2)),i.push(e.getX(o+1)),i.push(e.getX(o)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=r.clone();return s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),r}class Ad extends Fs{constructor(t){super(t),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new Yx(e)}),this.register(function(e){return new qx(e)}),this.register(function(e){return new nM(e)}),this.register(function(e){return new iM(e)}),this.register(function(e){return new sM(e)}),this.register(function(e){return new jx(e)}),this.register(function(e){return new $x(e)}),this.register(function(e){return new Zx(e)}),this.register(function(e){return new Jx(e)}),this.register(function(e){return new Xx(e)}),this.register(function(e){return new Qx(e)}),this.register(function(e){return new Kx(e)}),this.register(function(e){return new eM(e)}),this.register(function(e){return new tM(e)}),this.register(function(e){return new Vx(e)}),this.register(function(e){return new rM(e)}),this.register(function(e){return new oM(e)})}load(t,e,n,i){const s=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const c=cr.extractUrlBase(t);o=cr.resolveURL(c,this.path)}else o=cr.extractUrlBase(t);this.manager.itemStart(t);const a=function(c){i?i(c):console.error(c),s.manager.itemError(t),s.manager.itemEnd(t)},l=new md(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(t,function(c){try{s.parse(c,o,function(h){e(h),s.manager.itemEnd(t)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(t){return this.dracoLoader=t,this}setKTX2Loader(t){return this.ktx2Loader=t,this}setMeshoptDecoder(t){return this.meshoptDecoder=t,this}register(t){return this.pluginCallbacks.indexOf(t)===-1&&this.pluginCallbacks.push(t),this}unregister(t){return this.pluginCallbacks.indexOf(t)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t),1),this}parse(t,e,n,i){let s;const o={},a={},l=new TextDecoder;if(typeof t=="string")s=JSON.parse(t);else if(t instanceof ArrayBuffer)if(l.decode(new Uint8Array(t,0,4))===wd){try{o[qt.KHR_BINARY_GLTF]=new aM(t)}catch(d){i&&i(d);return}s=JSON.parse(o[qt.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(t));else s=t;if(s.asset===void 0||s.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new vM(s,{path:e||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const d=this.pluginCallbacks[h](c);d.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[d.name]=d,o[d.name]=!0}if(s.extensionsUsed)for(let h=0;h<s.extensionsUsed.length;++h){const d=s.extensionsUsed[h],u=s.extensionsRequired||[];switch(d){case qt.KHR_MATERIALS_UNLIT:o[d]=new Wx;break;case qt.KHR_DRACO_MESH_COMPRESSION:o[d]=new lM(s,this.dracoLoader);break;case qt.KHR_TEXTURE_TRANSFORM:o[d]=new cM;break;case qt.KHR_MESH_QUANTIZATION:o[d]=new hM;break;default:u.indexOf(d)>=0&&a[d]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+d+'".')}}c.setExtensions(o),c.setPlugins(a),c.parse(n,i)}parseAsync(t,e){const n=this;return new Promise(function(i,s){n.parse(t,e,i,s)})}}function kx(){let r={};return{get:function(t){return r[t]},add:function(t,e){r[t]=e},remove:function(t){delete r[t]},removeAll:function(){r={}}}}const qt={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Vx{constructor(t){this.parser=t,this.name=qt.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const t=this.parser,e=this.parser.json.nodes||[];for(let n=0,i=e.length;n<i;n++){const s=e[n];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&t._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(t){const e=this.parser,n="light:"+t;let i=e.cache.get(n);if(i)return i;const s=e.json,l=((s.extensions&&s.extensions[this.name]||{}).lights||[])[t];let c;const h=new Lt(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],ze);const d=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new lr(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Nl(h),c.distance=d;break;case"spot":c=new S_(h),c.distance=d,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),c.decay=2,ri(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=e.createUniqueName(l.name||"light_"+t),i=Promise.resolve(c),e.cache.add(n,i),i}getDependency(t,e){if(t==="light")return this._loadLight(e)}createNodeAttachment(t){const e=this,n=this.parser,s=n.json.nodes[t],a=(s.extensions&&s.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return n._getNodeRef(e.cache,a,l)})}}class Wx{constructor(){this.name=qt.KHR_MATERIALS_UNLIT}getMaterialType(){return ln}extendParams(t,e,n){const i=[];t.color=new Lt(1,1,1),t.opacity=1;const s=e.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const o=s.baseColorFactor;t.color.setRGB(o[0],o[1],o[2],ze),t.opacity=o[3]}s.baseColorTexture!==void 0&&i.push(n.assignTexture(t,"map",s.baseColorTexture,Be))}return Promise.all(i)}}class Xx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name].emissiveStrength;return s!==void 0&&(e.emissiveIntensity=s),Promise.resolve()}}class Yx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_CLEARCOAT}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];if(o.clearcoatFactor!==void 0&&(e.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&s.push(n.assignTexture(e,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(e.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&s.push(n.assignTexture(e,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(s.push(n.assignTexture(e,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const a=o.clearcoatNormalTexture.scale;e.clearcoatNormalScale=new jt(a,a)}return Promise.all(s)}}class qx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_DISPERSION}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return e.dispersion=s.dispersion!==void 0?s.dispersion:0,Promise.resolve()}}class Kx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_IRIDESCENCE}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.iridescenceFactor!==void 0&&(e.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&s.push(n.assignTexture(e,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(e.iridescenceIOR=o.iridescenceIor),e.iridescenceThicknessRange===void 0&&(e.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(e.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(e.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&s.push(n.assignTexture(e,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(s)}}class jx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_SHEEN}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[];e.sheenColor=new Lt(0,0,0),e.sheenRoughness=0,e.sheen=1;const o=i.extensions[this.name];if(o.sheenColorFactor!==void 0){const a=o.sheenColorFactor;e.sheenColor.setRGB(a[0],a[1],a[2],ze)}return o.sheenRoughnessFactor!==void 0&&(e.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&s.push(n.assignTexture(e,"sheenColorMap",o.sheenColorTexture,Be)),o.sheenRoughnessTexture!==void 0&&s.push(n.assignTexture(e,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(s)}}class $x{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_TRANSMISSION}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.transmissionFactor!==void 0&&(e.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&s.push(n.assignTexture(e,"transmissionMap",o.transmissionTexture)),Promise.all(s)}}class Zx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_VOLUME}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];e.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&s.push(n.assignTexture(e,"thicknessMap",o.thicknessTexture)),e.attenuationDistance=o.attenuationDistance||1/0;const a=o.attenuationColor||[1,1,1];return e.attenuationColor=new Lt().setRGB(a[0],a[1],a[2],ze),Promise.all(s)}}class Jx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_IOR}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const i=this.parser.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return e.ior=s.ior!==void 0?s.ior:1.5,Promise.resolve()}}class Qx{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_SPECULAR}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];e.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&s.push(n.assignTexture(e,"specularIntensityMap",o.specularTexture));const a=o.specularColorFactor||[1,1,1];return e.specularColor=new Lt().setRGB(a[0],a[1],a[2],ze),o.specularColorTexture!==void 0&&s.push(n.assignTexture(e,"specularColorMap",o.specularColorTexture,Be)),Promise.all(s)}}class tM{constructor(t){this.parser=t,this.name=qt.EXT_MATERIALS_BUMP}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return e.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&s.push(n.assignTexture(e,"bumpMap",o.bumpTexture)),Promise.all(s)}}class eM{constructor(t){this.parser=t,this.name=qt.KHR_MATERIALS_ANISOTROPY}getMaterialType(t){const n=this.parser.json.materials[t];return!n.extensions||!n.extensions[this.name]?null:Yn}extendMaterialParams(t,e){const n=this.parser,i=n.json.materials[t];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],o=i.extensions[this.name];return o.anisotropyStrength!==void 0&&(e.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(e.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&s.push(n.assignTexture(e,"anisotropyMap",o.anisotropyTexture)),Promise.all(s)}}class nM{constructor(t){this.parser=t,this.name=qt.KHR_TEXTURE_BASISU}loadTexture(t){const e=this.parser,n=e.json,i=n.textures[t];if(!i.extensions||!i.extensions[this.name])return null;const s=i.extensions[this.name],o=e.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return e.loadTextureImage(t,s.source,o)}}class iM{constructor(t){this.parser=t,this.name=qt.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(t,o.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(e)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(t)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(t){const e=new Image;e.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",e.onload=e.onerror=function(){t(e.height===1)}})),this.isSupported}}class sM{constructor(t){this.parser=t,this.name=qt.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(t){const e=this.name,n=this.parser,i=n.json,s=i.textures[t];if(!s.extensions||!s.extensions[e])return null;const o=s.extensions[e],a=i.images[o.source];let l=n.textureLoader;if(a.uri){const c=n.options.manager.getHandler(a.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(t,o.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(e)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(t)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(t){const e=new Image;e.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",e.onload=e.onerror=function(){t(e.height===1)}})),this.isSupported}}class rM{constructor(t){this.name=qt.EXT_MESHOPT_COMPRESSION,this.parser=t}loadBufferView(t){const e=this.parser.json,n=e.bufferViews[t];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],s=this.parser.getDependency("buffer",i.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(e.extensionsRequired&&e.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(a){const l=i.byteOffset||0,c=i.byteLength||0,h=i.count,d=i.byteStride,u=new Uint8Array(a,l,c);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,d,u,i.mode,i.filter).then(function(f){return f.buffer}):o.ready.then(function(){const f=new ArrayBuffer(h*d);return o.decodeGltfBuffer(new Uint8Array(f),h,d,u,i.mode,i.filter),f})})}else return null}}class oM{constructor(t){this.name=qt.EXT_MESH_GPU_INSTANCING,this.parser=t}createNodeMesh(t){const e=this.parser.json,n=e.nodes[t];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=e.meshes[n.mesh];for(const c of i.primitives)if(c.mode!==dn.TRIANGLES&&c.mode!==dn.TRIANGLE_STRIP&&c.mode!==dn.TRIANGLE_FAN&&c.mode!==void 0)return null;const o=n.extensions[this.name].attributes,a=[],l={};for(const c in o)a.push(this.parser.getDependency("accessor",o[c]).then(h=>(l[c]=h,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(t)),Promise.all(a).then(c=>{const h=c.pop(),d=h.isGroup?h.children:[h],u=c[0].count,f=[];for(const m of d){const _=new Gt,p=new P,g=new Dn,x=new P(1,1,1),M=new dd(m.geometry,m.material,u);for(let y=0;y<u;y++)l.TRANSLATION&&p.fromBufferAttribute(l.TRANSLATION,y),l.ROTATION&&g.fromBufferAttribute(l.ROTATION,y),l.SCALE&&x.fromBufferAttribute(l.SCALE,y),M.setMatrixAt(y,_.compose(p,g,x));for(const y in l)if(y==="_COLOR_0"){const A=l[y];M.instanceColor=new rl(A.array,A.itemSize,A.normalized)}else y!=="TRANSLATION"&&y!=="ROTATION"&&y!=="SCALE"&&m.geometry.setAttribute(y,l[y]);he.prototype.copy.call(M,m),this.parser.assignFinalMaterial(M),f.push(M)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const wd="glTF",Zs=12,yh={JSON:1313821514,BIN:5130562};class aM{constructor(t){this.name=qt.KHR_BINARY_GLTF,this.content=null,this.body=null;const e=new DataView(t,0,Zs),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(t.slice(0,4))),version:e.getUint32(4,!0),length:e.getUint32(8,!0)},this.header.magic!==wd)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-Zs,s=new DataView(t,Zs);let o=0;for(;o<i;){const a=s.getUint32(o,!0);o+=4;const l=s.getUint32(o,!0);if(o+=4,l===yh.JSON){const c=new Uint8Array(t,Zs+o,a);this.content=n.decode(c)}else if(l===yh.BIN){const c=Zs+o;this.body=t.slice(c,c+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class lM{constructor(t,e){if(!e)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=qt.KHR_DRACO_MESH_COMPRESSION,this.json=t,this.dracoLoader=e,this.dracoLoader.preload()}decodePrimitive(t,e){const n=this.json,i=this.dracoLoader,s=t.extensions[this.name].bufferView,o=t.extensions[this.name].attributes,a={},l={},c={};for(const h in o){const d=dl[h]||h.toLowerCase();a[d]=o[h]}for(const h in t.attributes){const d=dl[h]||h.toLowerCase();if(o[h]!==void 0){const u=n.accessors[t.attributes[h]],f=xs[u.componentType];c[d]=f.name,l[d]=u.normalized===!0}}return e.getDependency("bufferView",s).then(function(h){return new Promise(function(d,u){i.decodeDracoFile(h,function(f){for(const m in f.attributes){const _=f.attributes[m],p=l[m];p!==void 0&&(_.normalized=p)}d(f)},a,c,ze,u)})})}}class cM{constructor(){this.name=qt.KHR_TEXTURE_TRANSFORM}extendTexture(t,e){return(e.texCoord===void 0||e.texCoord===t.channel)&&e.offset===void 0&&e.rotation===void 0&&e.scale===void 0||(t=t.clone(),e.texCoord!==void 0&&(t.channel=e.texCoord),e.offset!==void 0&&t.offset.fromArray(e.offset),e.rotation!==void 0&&(t.rotation=e.rotation),e.scale!==void 0&&t.repeat.fromArray(e.scale),t.needsUpdate=!0),t}}class hM{constructor(){this.name=qt.KHR_MESH_QUANTIZATION}}class bd extends Mr{constructor(t,e,n,i){super(t,e,n,i)}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=t*i*3+i;for(let o=0;o!==i;o++)e[o]=n[s+o];return e}interpolate_(t,e,n,i){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,h=i-e,d=(n-e)/h,u=d*d,f=u*d,m=t*c,_=m-c,p=-2*f+3*u,g=f-u,x=1-p,M=g-u+d;for(let y=0;y!==a;y++){const A=o[_+y+a],w=o[_+y+l]*h,E=o[m+y+a],L=o[m+y]*h;s[y]=x*A+M*w+p*E+g*L}return s}}const dM=new Dn;class uM extends bd{interpolate_(t,e,n,i){const s=super.interpolate_(t,e,n,i);return dM.fromArray(s).normalize().toArray(s),s}}const dn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},xs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Sh={9728:je,9729:an,9984:Dh,9985:eo,9986:er,9987:ai},Eh={33071:Si,33648:co,10497:Ss},fa={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},dl={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Mi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},fM={CUBICSPLINE:void 0,LINEAR:fr,STEP:ur},pa={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function pM(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new _e({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Vn})),r.DefaultMaterial}function Oi(r,t,e){for(const n in e.extensions)r[n]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[n]=e.extensions[n])}function ri(r,t){t.extras!==void 0&&(typeof t.extras=="object"?Object.assign(r.userData,t.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras))}function mM(r,t,e){let n=!1,i=!1,s=!1;for(let c=0,h=t.length;c<h;c++){const d=t[c];if(d.POSITION!==void 0&&(n=!0),d.NORMAL!==void 0&&(i=!0),d.COLOR_0!==void 0&&(s=!0),n&&i&&s)break}if(!n&&!i&&!s)return Promise.resolve(r);const o=[],a=[],l=[];for(let c=0,h=t.length;c<h;c++){const d=t[c];if(n){const u=d.POSITION!==void 0?e.getDependency("accessor",d.POSITION):r.attributes.position;o.push(u)}if(i){const u=d.NORMAL!==void 0?e.getDependency("accessor",d.NORMAL):r.attributes.normal;a.push(u)}if(s){const u=d.COLOR_0!==void 0?e.getDependency("accessor",d.COLOR_0):r.attributes.color;l.push(u)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l)]).then(function(c){const h=c[0],d=c[1],u=c[2];return n&&(r.morphAttributes.position=h),i&&(r.morphAttributes.normal=d),s&&(r.morphAttributes.color=u),r.morphTargetsRelative=!0,r})}function gM(r,t){if(r.updateMorphTargets(),t.weights!==void 0)for(let e=0,n=t.weights.length;e<n;e++)r.morphTargetInfluences[e]=t.weights[e];if(t.extras&&Array.isArray(t.extras.targetNames)){const e=t.extras.targetNames;if(r.morphTargetInfluences.length===e.length){r.morphTargetDictionary={};for(let n=0,i=e.length;n<i;n++)r.morphTargetDictionary[e[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function _M(r){let t;const e=r.extensions&&r.extensions[qt.KHR_DRACO_MESH_COMPRESSION];if(e?t="draco:"+e.bufferView+":"+e.indices+":"+ma(e.attributes):t=r.indices+":"+ma(r.attributes)+":"+r.mode,r.targets!==void 0)for(let n=0,i=r.targets.length;n<i;n++)t+=":"+ma(r.targets[n]);return t}function ma(r){let t="";const e=Object.keys(r).sort();for(let n=0,i=e.length;n<i;n++)t+=e[n]+":"+r[e[n]]+";";return t}function ul(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function xM(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const MM=new Gt;class vM{constructor(t={},e={}){this.json=t,this.extensions={},this.plugins={},this.options=e,this.cache=new kx,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,s=!1,o=-1;if(typeof navigator<"u"){const a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;const l=a.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,s=a.indexOf("Firefox")>-1,o=s?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||s&&o<98?this.textureLoader=new v_(this.options.manager):this.textureLoader=new w_(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new md(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(t){this.extensions=t}setPlugins(t){this.plugins=t}parse(t,e){const n=this,i=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){const a={scene:o[0][i.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:i.asset,parser:n,userData:{}};return Oi(s,a,i),ri(a,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(const l of a.scenes)l.updateMatrixWorld();t(a)})}).catch(e)}_markDefs(){const t=this.json.nodes||[],e=this.json.skins||[],n=this.json.meshes||[];for(let i=0,s=e.length;i<s;i++){const o=e[i].joints;for(let a=0,l=o.length;a<l;a++)t[o[a]].isBone=!0}for(let i=0,s=t.length;i<s;i++){const o=t[i];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(t,e){e!==void 0&&(t.refs[e]===void 0&&(t.refs[e]=t.uses[e]=0),t.refs[e]++)}_getNodeRef(t,e,n){if(t.refs[e]<=1)return n;const i=n.clone(),s=(o,a)=>{const l=this.associations.get(o);l!=null&&this.associations.set(a,l);for(const[c,h]of o.children.entries())s(h,a.children[c])};return s(n,i),i.name+="_instance_"+t.uses[e]++,i}_invokeOne(t){const e=Object.values(this.plugins);e.push(this);for(let n=0;n<e.length;n++){const i=t(e[n]);if(i)return i}return null}_invokeAll(t){const e=Object.values(this.plugins);e.unshift(this);const n=[];for(let i=0;i<e.length;i++){const s=t(e[i]);s&&n.push(s)}return n}getDependency(t,e){const n=t+":"+e;let i=this.cache.get(n);if(!i){switch(t){case"scene":i=this.loadScene(e);break;case"node":i=this._invokeOne(function(s){return s.loadNode&&s.loadNode(e)});break;case"mesh":i=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(e)});break;case"accessor":i=this.loadAccessor(e);break;case"bufferView":i=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(e)});break;case"buffer":i=this.loadBuffer(e);break;case"material":i=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(e)});break;case"texture":i=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(e)});break;case"skin":i=this.loadSkin(e);break;case"animation":i=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(e)});break;case"camera":i=this.loadCamera(e);break;default:if(i=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(t,e)}),!i)throw new Error("Unknown type: "+t);break}this.cache.add(n,i)}return i}getDependencies(t){let e=this.cache.get(t);if(!e){const n=this,i=this.json[t+(t==="mesh"?"es":"s")]||[];e=Promise.all(i.map(function(s,o){return n.getDependency(t,o)})),this.cache.add(t,e)}return e}loadBuffer(t){const e=this.json.buffers[t],n=this.fileLoader;if(e.type&&e.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+e.type+" buffer type is not supported.");if(e.uri===void 0&&t===0)return Promise.resolve(this.extensions[qt.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(s,o){n.load(cr.resolveURL(e.uri,i.path),s,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+e.uri+'".'))})})}loadBufferView(t){const e=this.json.bufferViews[t];return this.getDependency("buffer",e.buffer).then(function(n){const i=e.byteLength||0,s=e.byteOffset||0;return n.slice(s,s+i)})}loadAccessor(t){const e=this,n=this.json,i=this.json.accessors[t];if(i.bufferView===void 0&&i.sparse===void 0){const o=fa[i.type],a=xs[i.componentType],l=i.normalized===!0,c=new a(i.count*o);return Promise.resolve(new Te(c,o,l))}const s=[];return i.bufferView!==void 0?s.push(this.getDependency("bufferView",i.bufferView)):s.push(null),i.sparse!==void 0&&(s.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(s).then(function(o){const a=o[0],l=fa[i.type],c=xs[i.componentType],h=c.BYTES_PER_ELEMENT,d=h*l,u=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,m=i.normalized===!0;let _,p;if(f&&f!==d){const g=Math.floor(u/f),x="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+g+":"+i.count;let M=e.cache.get(x);M||(_=new c(a,g*f,i.count*f/h),M=new Jg(_,f/h),e.cache.add(x,M)),p=new Cl(M,l,u%f/h,m)}else a===null?_=new c(i.count*l):_=new c(a,u,i.count*l),p=new Te(_,l,m);if(i.sparse!==void 0){const g=fa.SCALAR,x=xs[i.sparse.indices.componentType],M=i.sparse.indices.byteOffset||0,y=i.sparse.values.byteOffset||0,A=new x(o[1],M,i.sparse.count*g),w=new c(o[2],y,i.sparse.count*l);a!==null&&(p=new Te(p.array.slice(),p.itemSize,p.normalized)),p.normalized=!1;for(let E=0,L=A.length;E<L;E++){const U=A[E];if(p.setX(U,w[E*l]),l>=2&&p.setY(U,w[E*l+1]),l>=3&&p.setZ(U,w[E*l+2]),l>=4&&p.setW(U,w[E*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}p.normalized=m}return p})}loadTexture(t){const e=this.json,n=this.options,s=e.textures[t].source,o=e.images[s];let a=this.textureLoader;if(o.uri){const l=n.manager.getHandler(o.uri);l!==null&&(a=l)}return this.loadTextureImage(t,s,a)}loadTextureImage(t,e,n){const i=this,s=this.json,o=s.textures[t],a=s.images[e],l=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(e,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);const u=(s.samplers||{})[o.sampler]||{};return h.magFilter=Sh[u.magFilter]||an,h.minFilter=Sh[u.minFilter]||ai,h.wrapS=Eh[u.wrapS]||Ss,h.wrapT=Eh[u.wrapT]||Ss,i.associations.set(h,{textures:t}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(t,e){const n=this,i=this.json,s=this.options;if(this.sourceCache[t]!==void 0)return this.sourceCache[t].then(d=>d.clone());const o=i.images[t],a=self.URL||self.webkitURL;let l=o.uri||"",c=!1;if(o.bufferView!==void 0)l=n.getDependency("bufferView",o.bufferView).then(function(d){c=!0;const u=new Blob([d],{type:o.mimeType});return l=a.createObjectURL(u),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+t+" is missing URI and bufferView");const h=Promise.resolve(l).then(function(d){return new Promise(function(u,f){let m=u;e.isImageBitmapLoader===!0&&(m=function(_){const p=new Ae(_);p.needsUpdate=!0,u(p)}),e.load(cr.resolveURL(d,s.path),m,void 0,f)})}).then(function(d){return c===!0&&a.revokeObjectURL(l),ri(d,o),d.userData.mimeType=o.mimeType||xM(o.uri),d}).catch(function(d){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),d});return this.sourceCache[t]=h,h}assignTexture(t,e,n,i){const s=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),s.extensions[qt.KHR_TEXTURE_TRANSFORM]){const a=n.extensions!==void 0?n.extensions[qt.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const l=s.associations.get(o);o=s.extensions[qt.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),s.associations.set(o,l)}}return i!==void 0&&(o.colorSpace=i),t[e]=o,o})}assignFinalMaterial(t){const e=t.geometry;let n=t.material;const i=e.attributes.tangent===void 0,s=e.attributes.color!==void 0,o=e.attributes.normal===void 0;if(t.isPoints){const a="PointsMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new ud,kn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(a,l)),n=l}else if(t.isLine){const a="LineBasicMaterial:"+n.uuid;let l=this.cache.get(a);l||(l=new Ll,kn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(a,l)),n=l}if(i||s||o){let a="ClonedMaterial:"+n.uuid+":";i&&(a+="derivative-tangents:"),s&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=n.clone(),s&&(l.vertexColors=!0),o&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(n))),n=l}t.material=n}getMaterialType(){return _e}loadMaterial(t){const e=this,n=this.json,i=this.extensions,s=n.materials[t];let o;const a={},l=s.extensions||{},c=[];if(l[qt.KHR_MATERIALS_UNLIT]){const d=i[qt.KHR_MATERIALS_UNLIT];o=d.getMaterialType(),c.push(d.extendParams(a,s,e))}else{const d=s.pbrMetallicRoughness||{};if(a.color=new Lt(1,1,1),a.opacity=1,Array.isArray(d.baseColorFactor)){const u=d.baseColorFactor;a.color.setRGB(u[0],u[1],u[2],ze),a.opacity=u[3]}d.baseColorTexture!==void 0&&c.push(e.assignTexture(a,"map",d.baseColorTexture,Be)),a.metalness=d.metallicFactor!==void 0?d.metallicFactor:1,a.roughness=d.roughnessFactor!==void 0?d.roughnessFactor:1,d.metallicRoughnessTexture!==void 0&&(c.push(e.assignTexture(a,"metalnessMap",d.metallicRoughnessTexture)),c.push(e.assignTexture(a,"roughnessMap",d.metallicRoughnessTexture))),o=this._invokeOne(function(u){return u.getMaterialType&&u.getMaterialType(t)}),c.push(Promise.all(this._invokeAll(function(u){return u.extendMaterialParams&&u.extendMaterialParams(t,a)})))}s.doubleSided===!0&&(a.side=Rn);const h=s.alphaMode||pa.OPAQUE;if(h===pa.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===pa.MASK&&(a.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&o!==ln&&(c.push(e.assignTexture(a,"normalMap",s.normalTexture)),a.normalScale=new jt(1,1),s.normalTexture.scale!==void 0)){const d=s.normalTexture.scale;a.normalScale.set(d,d)}if(s.occlusionTexture!==void 0&&o!==ln&&(c.push(e.assignTexture(a,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&o!==ln){const d=s.emissiveFactor;a.emissive=new Lt().setRGB(d[0],d[1],d[2],ze)}return s.emissiveTexture!==void 0&&o!==ln&&c.push(e.assignTexture(a,"emissiveMap",s.emissiveTexture,Be)),Promise.all(c).then(function(){const d=new o(a);return s.name&&(d.name=s.name),ri(d,s),e.associations.set(d,{materials:t}),s.extensions&&Oi(i,d,s),d})}createUniqueName(t){const e=ce.sanitizeNodeName(t||"");return e in this.nodeNamesUsed?e+"_"+ ++this.nodeNamesUsed[e]:(this.nodeNamesUsed[e]=0,e)}loadGeometries(t){const e=this,n=this.extensions,i=this.primitiveCache;function s(a){return n[qt.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,e).then(function(l){return Th(l,a,e)})}const o=[];for(let a=0,l=t.length;a<l;a++){const c=t[a],h=_M(c),d=i[h];if(d)o.push(d.promise);else{let u;c.extensions&&c.extensions[qt.KHR_DRACO_MESH_COMPRESSION]?u=s(c):u=Th(new Ye,c,e),i[h]={primitive:c,promise:u},o.push(u)}}return Promise.all(o)}loadMesh(t){const e=this,n=this.json,i=this.extensions,s=n.meshes[t],o=s.primitives,a=[];for(let l=0,c=o.length;l<c;l++){const h=o[l].material===void 0?pM(this.cache):this.getDependency("material",o[l].material);a.push(h)}return a.push(e.loadGeometries(o)),Promise.all(a).then(function(l){const c=l.slice(0,l.length-1),h=l[l.length-1],d=[];for(let f=0,m=h.length;f<m;f++){const _=h[f],p=o[f];let g;const x=c[f];if(p.mode===dn.TRIANGLES||p.mode===dn.TRIANGLE_STRIP||p.mode===dn.TRIANGLE_FAN||p.mode===void 0)g=s.isSkinnedMesh===!0?new t_(_,x):new ht(_,x),g.isSkinnedMesh===!0&&g.normalizeSkinWeights(),p.mode===dn.TRIANGLE_STRIP?g.geometry=vh(g.geometry,Vh):p.mode===dn.TRIANGLE_FAN&&(g.geometry=vh(g.geometry,nl));else if(p.mode===dn.LINES)g=new i_(_,x);else if(p.mode===dn.LINE_STRIP)g=new mr(_,x);else if(p.mode===dn.LINE_LOOP)g=new s_(_,x);else if(p.mode===dn.POINTS)g=new r_(_,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+p.mode);Object.keys(g.geometry.morphAttributes).length>0&&gM(g,s),g.name=e.createUniqueName(s.name||"mesh_"+t),ri(g,s),p.extensions&&Oi(i,g,p),e.assignFinalMaterial(g),d.push(g)}for(let f=0,m=d.length;f<m;f++)e.associations.set(d[f],{meshes:t,primitives:f});if(d.length===1)return s.extensions&&Oi(i,d[0],s),d[0];const u=new $t;s.extensions&&Oi(i,u,s),e.associations.set(u,{meshes:t});for(let f=0,m=d.length;f<m;f++)u.add(d[f]);return u})}loadCamera(t){let e;const n=this.json.cameras[t],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?e=new We(Fe.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(e=new wl(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(e.name=this.createUniqueName(n.name)),ri(e,n),Promise.resolve(e)}loadSkin(t){const e=this.json.skins[t],n=[];for(let i=0,s=e.joints.length;i<s;i++)n.push(this._loadNodeShallow(e.joints[i]));return e.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",e.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const s=i.pop(),o=i,a=[],l=[];for(let c=0,h=o.length;c<h;c++){const d=o[c];if(d){a.push(d);const u=new Gt;s!==null&&u.fromArray(s.array,c*16),l.push(u)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',e.joints[c])}return new Pl(a,l)})}loadAnimation(t){const e=this.json,n=this,i=e.animations[t],s=i.name?i.name:"animation_"+t,o=[],a=[],l=[],c=[],h=[];for(let d=0,u=i.channels.length;d<u;d++){const f=i.channels[d],m=i.samplers[f.sampler],_=f.target,p=_.node,g=i.parameters!==void 0?i.parameters[m.input]:m.input,x=i.parameters!==void 0?i.parameters[m.output]:m.output;_.node!==void 0&&(o.push(this.getDependency("node",p)),a.push(this.getDependency("accessor",g)),l.push(this.getDependency("accessor",x)),c.push(m),h.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(d){const u=d[0],f=d[1],m=d[2],_=d[3],p=d[4],g=[];for(let x=0,M=u.length;x<M;x++){const y=u[x],A=f[x],w=m[x],E=_[x],L=p[x];if(y===void 0)continue;y.updateMatrix&&y.updateMatrix();const U=n._createAnimationTracks(y,A,w,E,L);if(U)for(let v=0;v<U.length;v++)g.push(U[v])}return new f_(s,void 0,g)})}createNodeMesh(t){const e=this.json,n=this,i=e.nodes[t];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(s){const o=n._getNodeRef(n.meshCache,i.mesh,s);return i.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let l=0,c=i.weights.length;l<c;l++)a.morphTargetInfluences[l]=i.weights[l]}),o})}loadNode(t){const e=this.json,n=this,i=e.nodes[t],s=n._loadNodeShallow(t),o=[],a=i.children||[];for(let c=0,h=a.length;c<h;c++)o.push(n.getDependency("node",a[c]));const l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([s,Promise.all(o),l]).then(function(c){const h=c[0],d=c[1],u=c[2];u!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(u,MM)});for(let f=0,m=d.length;f<m;f++)h.add(d[f]);return h})}_loadNodeShallow(t){const e=this.json,n=this.extensions,i=this;if(this.nodeCache[t]!==void 0)return this.nodeCache[t];const s=e.nodes[t],o=s.name?i.createUniqueName(s.name):"",a=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(t)});return l&&a.push(l),s.camera!==void 0&&a.push(i.getDependency("camera",s.camera).then(function(c){return i._getNodeRef(i.cameraCache,s.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(t)}).forEach(function(c){a.push(c)}),this.nodeCache[t]=Promise.all(a).then(function(c){let h;if(s.isBone===!0?h=new cd:c.length>1?h=new $t:c.length===1?h=c[0]:h=new he,h!==c[0])for(let d=0,u=c.length;d<u;d++)h.add(c[d]);if(s.name&&(h.userData.name=s.name,h.name=o),ri(h,s),s.extensions&&Oi(n,h,s),s.matrix!==void 0){const d=new Gt;d.fromArray(s.matrix),h.applyMatrix4(d)}else s.translation!==void 0&&h.position.fromArray(s.translation),s.rotation!==void 0&&h.quaternion.fromArray(s.rotation),s.scale!==void 0&&h.scale.fromArray(s.scale);return i.associations.has(h)||i.associations.set(h,{}),i.associations.get(h).nodes=t,h}),this.nodeCache[t]}loadScene(t){const e=this.extensions,n=this.json.scenes[t],i=this,s=new $t;n.name&&(s.name=i.createUniqueName(n.name)),ri(s,n),n.extensions&&Oi(e,s,n);const o=n.nodes||[],a=[];for(let l=0,c=o.length;l<c;l++)a.push(i.getDependency("node",o[l]));return Promise.all(a).then(function(l){for(let h=0,d=l.length;h<d;h++)s.add(l[h]);const c=h=>{const d=new Map;for(const[u,f]of i.associations)(u instanceof kn||u instanceof Ae)&&d.set(u,f);return h.traverse(u=>{const f=i.associations.get(u);f!=null&&d.set(u,f)}),d};return i.associations=c(s),s})}_createAnimationTracks(t,e,n,i,s){const o=[],a=t.name?t.name:t.uuid,l=[];Mi[s.path]===Mi.weights?t.traverse(function(u){u.morphTargetInfluences&&l.push(u.name?u.name:u.uuid)}):l.push(a);let c;switch(Mi[s.path]){case Mi.weights:c=bs;break;case Mi.rotation:c=Rs;break;case Mi.position:case Mi.scale:c=Cs;break;default:switch(n.itemSize){case 1:c=bs;break;case 2:case 3:default:c=Cs;break}break}const h=i.interpolation!==void 0?fM[i.interpolation]:fr,d=this._getArrayFromAccessor(n);for(let u=0,f=l.length;u<f;u++){const m=new c(l[u]+"."+Mi[s.path],e.array,d,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),o.push(m)}return o}_getArrayFromAccessor(t){let e=t.array;if(t.normalized){const n=ul(e.constructor),i=new Float32Array(e.length);for(let s=0,o=e.length;s<o;s++)i[s]=e[s]*n;e=i}return e}_createCubicSplineTrackInterpolant(t){t.createInterpolant=function(n){const i=this instanceof Rs?uM:bd;return new i(this.times,this.values,this.getValueSize()/3,n)},t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function yM(r,t,e){const n=t.attributes,i=new hi;if(n.POSITION!==void 0){const a=e.json.accessors[n.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(i.set(new P(l[0],l[1],l[2]),new P(c[0],c[1],c[2])),a.normalized){const h=ul(xs[a.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=t.targets;if(s!==void 0){const a=new P,l=new P;for(let c=0,h=s.length;c<h;c++){const d=s[c];if(d.POSITION!==void 0){const u=e.json.accessors[d.POSITION],f=u.min,m=u.max;if(f!==void 0&&m!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(m[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(m[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(m[2]))),u.normalized){const _=ul(xs[u.componentType]);l.multiplyScalar(_)}a.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(a)}r.boundingBox=i;const o=new Xn;i.getCenter(o.center),o.radius=i.min.distanceTo(i.max)/2,r.boundingSphere=o}function Th(r,t,e){const n=t.attributes,i=[];function s(o,a){return e.getDependency("accessor",o).then(function(l){r.setAttribute(a,l)})}for(const o in n){const a=dl[o]||o.toLowerCase();a in r.attributes||i.push(s(n[o],a))}if(t.indices!==void 0&&!r.index){const o=e.getDependency("accessor",t.indices).then(function(a){r.setIndex(a)});i.push(o)}return ee.workingColorSpace!==ze&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ee.workingColorSpace}" not supported.`),ri(r,t),yM(r,t,e),Promise.all(i).then(function(){return t.targets!==void 0?mM(r,t.targets,e):r})}const SM=new Ad;async function EM(r="/assets/catalog.json"){const t=await fetch(r);if(!t.ok)return console.warn("[assets] catalog missing",r),{props:{}};const e=await t.json(),n={},i=Object.entries(e.props||{});return await Promise.all(i.map(async([s,o])=>{const a="/"+o.glb.replace(/^\/?/,"");try{const c=(await SM.loadAsync(a)).scene;c.traverse(h=>{h.isMesh&&(h.castShadow=!0,h.receiveShadow=!0)}),n[s]={template:c,collision:o.collision||[1,1,1],ref:o.ref||null}}catch(l){console.warn(`[assets] failed to load ${s}`,l.message||l)}})),console.info(`[assets] loaded ${Object.keys(n).length}/${i.length} prop models`),{props:n,catalog:e}}function TM(r,t,e,n,i,s={}){const o=s.count??180,a=Object.keys(i.props||{});if(!a.length)return{placed:0};const l=dt.SIZE/2-50;let c=0,h=0;const d=o*40,u=new $t;for(u.name="assetProps";c<o&&h<d;){h++;const f=(n()*2-1)*l,m=(n()*2-1)*l,_=e.heightAt(f,m);if(_<2.8||e.slopeDegAt(f,m)>22||e.roadAt(f,m)>.3||Math.abs(f)>520||m<-550||m>600)continue;const p=a[Math.floor(n()*a.length)%a.length],x=f<-200&&n()>.4&&i.props.palm_tree?"palm_tree":p,M=i.props[x];if(!M)continue;const[y,A,w]=M.collision,E=Math.floor(n()*4)*Math.PI/2,L=M.template.clone(!0);L.position.set(f,_-.02,m),L.rotation.y=E;const U=.9+n()*.25;L.scale.setScalar(U),u.add(L);const v=Math.abs(Math.sin(E))>.5,S=v?w*U:y*U,I=v?y*U:w*U,D=A*U;t.add(new P(f-S/2,_-.02,m-I/2),new P(f+S/2,_-.02+D,m+I/2),"prop"),c++}return r.add(u),{placed:c,attempts:h}}function AM(r,t,e,n,i,s){let o=r.heightAt(n,i);o>s&&(o=-1/0),t.query(n-.05,i-.05,n+.05,i+.05,e);for(const a of e)n<a.min.x||n>a.max.x||i<a.min.z||i>a.max.z||a.max.y<=s&&a.max.y>o&&(o=a.max.y);return o}function wM(r,t,e,n,i,s,o){let a=r.heightAt(n,i);a>s&&(a=-1/0),t.query(n-o,i-o,n+o,i+o,e);for(const l of e){const c=Math.max(l.min.x-n,0,n-l.max.x),h=Math.max(l.min.z-i,0,i-l.max.z);c*c+h*h>o*o||l.max.y<=s&&l.max.y>a&&(a=l.max.y)}return a}function Rd(r,t,e,n,i,s,o){r.query(e-o,n-o,e+o,n+o,t);for(const a of t){const l=Math.max(a.min.x-e,0,e-a.max.x),c=Math.max(a.min.z-n,0,n-a.max.z);if(!(l*l+c*c>o*o)&&a.max.y>i&&a.min.y<s)return!1}return!0}function bM(r,t,e,n,i,s,o){const a=gr.GROUND_PROBE,l=r.heightAt(n.x,n.z);let c=-1/0,h=!1;l<=n.y+.02&&l>=n.y-a&&(c=l,h=!0),t.query(n.x-i,n.z-i,n.x+i,n.z+i,e);for(const d of e){const u=Math.max(d.min.x-n.x,0,n.x-d.max.x),f=Math.max(d.min.z-n.z,0,n.z-d.max.z);u*u+f*f>i*i||d.max.y<=n.y+.02&&d.max.y>=n.y-a&&d.max.y>c&&(c=d.max.y,h=!1)}if(o.grounded=!1,o.groundY=c,o.steep=null,c===-1/0)return o;if(h){const d=r.normalAt(n.x,n.z,o.normal);if(d.y<s)return o.steep=d,o}return o.grounded=!0,o}function RM(r,t,e,n,i,s,o){const a=-Math.sin(s),l=-Math.cos(s),c=n.x+a*zi.REACH,h=n.z+l*zi.REACH,d=AM(r,t,e,c,h,n.y+zi.MAX_HEIGHT);if(d===-1/0)return null;const u=d-n.y;return u<zi.MIN_HEIGHT||u>zi.MAX_HEIGHT||!Rd(t,e,c,h,d+.05,d+zi.CLEARANCE,i)?null:o.set(c+a*.35,d+.02,h+l*.35)}const CM=Math.cos(Kt.MAX_SLOPE_DEG*Math.PI/180);class PM{constructor(t,e,n){this.terrain=t,this.hash=e,this.bus=n,this.pos=new P(Kt.SPAWN.x,0,Kt.SPAWN.z),this.pos.y=t.heightAt(this.pos.x,this.pos.z)+1,this.prevPos=this.pos.clone(),this.vel=new P,this.height=Kt.HEIGHT_STAND,this.radius=Kt.CAPSULE_RADIUS,this.grounded=!1,this.groundY=this.pos.y,this.coyote=0,this.jumpBuffer=0,this.crouching=!1,this.sprinting=!1,this.ads=!1,this.sliding=!1,this.slideTimer=0,this.slideCooldown=0,this.slideDir=new jt(0,1),this.mantling=!1,this.mantleTimer=0,this.mantleFrom=new P,this.mantleTo=new P,this.onLadder=!1,this.ladders=zl,this.speed=0,this.distanceTravelled=0,this._candidates=[],this._result=ix(),this._ground={grounded:!1,groundY:-1/0,steep:null,normal:new P},this._steepNormal=null,this._wish=new P,this._step=new P}get eyeHeight(){if(this.sliding)return Je.CAMERA_HEIGHT;const t=(this.height-Kt.HEIGHT_CROUCH)/(Kt.HEIGHT_STAND-Kt.HEIGHT_CROUCH);return ie(Kt.EYE_CROUCH,Kt.EYE_STAND,Qe(t,0,1))}get eyePosition(){return LM.set(this.pos.x,this.pos.y+this.eyeHeight,this.pos.z)}_supportTop(t,e,n){return wM(this.terrain,this.hash,this._candidates,t,e,n,this.radius)}_spanClear(t,e,n,i){return Rd(this.hash,this._candidates,t,e,n,i,this.radius)}_groundProbe(){bM(this.terrain,this.hash,this._candidates,this.pos,this.radius,CM,this._ground),this.grounded=this._ground.grounded,this._steepNormal=this._ground.steep,this._ground.groundY!==-1/0&&(this.groundY=this._ground.groundY),this.grounded&&this.vel.y<=0&&(this.pos.y=this._ground.groundY,this.vel.y=0)}_moveAndCollide(t){const e=t.length(),n=Math.max(1,Math.ceil(e/gr.MAX_SUBSTEP));this._step.copy(t).divideScalar(n);let i=!1;for(let s=0;s<n;s++){this.pos.add(this._step);const o=this.terrain.heightAt(this.pos.x,this.pos.z);this.pos.y<o&&(this.pos.y=o),gh(this.pos,this.radius,this.height,this.hash,this._candidates,this._result),this._result.hitWall&&(i=!0),this._result.hitCeiling&&this.vel.y>0&&(this.vel.y=0)}return i}_tryStepUp(t,e){const n=OM.copy(this.pos),i=Math.hypot(this.pos.x-t.x,this.pos.z-t.z),s=this._supportTop(t.x+e.x,t.z+e.z,t.y+Kt.MAX_STEP_HEIGHT+.01),o=s-t.y;if(s===-1/0||o<=.001||o>Kt.MAX_STEP_HEIGHT||!this._spanClear(t.x,t.z,t.y+this.height,t.y+this.height+o+.02))return!1;if(this.pos.copy(t),this.pos.y=s+.02,gh(this.pos,this.radius,this.height,this.hash,this._candidates,this._result),this._result.hitWall)return this.pos.copy(n),!1;if(this._moveAndCollide(NM.copy(e)),Math.hypot(this.pos.x-t.x,this.pos.z-t.z)<=i+1e-4)return this.pos.copy(n),!1;const l=this._supportTop(this.pos.x,this.pos.z,this.pos.y+.01);return l===-1/0||this.pos.y-l>Kt.MAX_STEP_HEIGHT+.05||l<t.y-.01?(this.pos.copy(n),!1):(this.pos.y=l,!0)}_tryMantle(t){const e=RM(this.terrain,this.hash,this._candidates,this.pos,this.radius,t,DM);return e?(this.mantling=!0,this.mantleTimer=0,this.mantleFrom.copy(this.pos),this.mantleTo.copy(e),this.vel.set(0,0,0),this.bus.emit("player:mantle",{from:this.mantleFrom.clone(),to:this.mantleTo.clone()}),!0):!1}tick(t,e,n){if(this.prevPos.copy(this.pos),this.mantling){this.mantleTimer+=t;const g=Qe(this.mantleTimer/zi.DURATION,0,1),x=g*g*(3-2*g);this.pos.lerpVectors(this.mantleFrom,this.mantleTo,x),g>=1&&(this.mantling=!1,this.grounded=!0),this.speed=0;return}const i=(e.action("forward")?1:0)-(e.action("back")?1:0),s=(e.action("right")?1:0)-(e.action("left")?1:0),o=Math.sin(n),a=Math.cos(n);this._wish.set(-o*i+a*s,0,-a*i-o*s),this._wish.lengthSq()>1e-6&&this._wish.normalize();const l=e.action("sprint")&&i>0&&!this.crouching,c=e.action("crouch");this.jumpBuffer>0&&(this.jumpBuffer-=t),e.actionPressed("jump")&&(this.jumpBuffer=Kt.JUMP_BUFFER),this.slideCooldown>0&&(this.slideCooldown-=t);const h=Math.hypot(this.vel.x,this.vel.z);if(!this.sliding&&c&&this.sprinting&&this.grounded&&this.slideCooldown<=0&&h>Kt.SPEED_WALK){this.sliding=!0,this.slideTimer=0;const g=Math.min(h*Je.SPEED_MULT,Je.SPEED_CAP);h>1e-4&&(this.vel.x=this.vel.x/h*g,this.vel.z=this.vel.z/h*g),this.slideDir.set(this.vel.x,this.vel.z).normalize(),this.bus.emit("player:slide",{speed:g})}const d=this.grounded||this.coyote>0;if(this.jumpBuffer>0&&d)if(!this._tryMantle(n))this.vel.y=Kt.JUMP_IMPULSE,this.sliding=!1,this.slideCooldown=Je.COOLDOWN,this.grounded=!1,this.coyote=0,this.jumpBuffer=0,this.bus.emit("player:jump",{});else{this.jumpBuffer=0;return}else if(this.jumpBuffer>0&&!this.grounded&&this._tryMantle(n)){this.jumpBuffer=0;return}this.sprinting=l&&!this.sliding;const u=c||this.sliding?Kt.HEIGHT_CROUCH:Kt.HEIGHT_STAND;if(u>this.height){let g=this._spanClear(this.pos.x,this.pos.z,this.pos.y+this.height+.02,this.pos.y+u);if(!g&&!c){const x=[[.35,0],[-.35,0],[0,.35],[0,-.35],[.45,.45],[-.45,.45]];for(const[M,y]of x)if(this._spanClear(this.pos.x+M,this.pos.z+y,this.pos.y+this.height+.02,this.pos.y+u)){this.pos.x+=M*.35,this.pos.z+=y*.35,g=!0;break}}g&&(this.height=Math.min(u,this.height+Kt.CROUCH_LERP*t))}else this.height=Math.max(u,this.height-Kt.CROUCH_LERP*t);if(this.crouching=this.height<Kt.HEIGHT_STAND-.05,this.sliding)this._tickSlide(t);else{let g=Kt.SPEED_WALK;if(this.sprinting?g=Kt.SPEED_SPRINT:this.crouching&&(g=Kt.SPEED_CROUCH),this.ads&&(g*=Kt.ADS_MOVE_MULT),this.grounded){const x=Math.hypot(this.vel.x,this.vel.z);if(x>0){const M=x*Kt.FRICTION_GROUND*t,y=Math.max(0,x-M)/x;this.vel.x*=y,this.vel.z*=y}this._accelerate(this._wish,g,Kt.ACCEL_GROUND,t)}else this._accelerate(this._wish,g,Kt.ACCEL_AIR,t,Kt.AIR_CONTROL)}if(this._steepNormal){const g=this._steepNormal;this.vel.x+=g.x*Je.SLOPE_ACCEL*t,this.vel.z+=g.z*Je.SLOPE_ACCEL*t}const f=this.ladders.findAt(this.pos.x,this.pos.y+this.height*.4,this.pos.z,this.radius);if(this.onLadder=!!f,f){let g=i;(e.actionPressed("jump")||e.action("jump"))&&(g=Math.max(g,1)),c&&(g=Math.min(g,-1)),this.vel.y=g*Ks.SPEED,this.vel.x*=1-Ks.STICK,this.vel.z*=1-Ks.STICK,this.vel.x+=(f.cx-this.pos.x)*Ks.CENTER_PULL*t,this.vel.z+=(f.cz-this.pos.z)*Ks.CENTER_PULL*t,this.sliding=!1,this.grounded=!1,this.coyote=0;const x=f.y0-.05,M=f.y1-.2;this.pos.y<x&&this.vel.y<0&&(this.vel.y=0),this.pos.y>M&&this.vel.y>0&&(this.vel.y=0)}!this.grounded&&!this.onLadder&&(this.vel.y+=Kt.GRAVITY*t);const m=Ah.set(this.vel.x*t,0,this.vel.z*t),_=UM.copy(this.pos);if(this._moveAndCollide(m),(this.grounded||this.coyote>0)&&!this.onLadder){const g=Math.hypot(this.pos.x-_.x,this.pos.z-_.z),x=Math.hypot(m.x,m.z);x>1e-4&&g<x*.95&&this._tryStepUp(_,m)}if(this._moveAndCollide(Ah.set(0,this.vel.y*t,0)),this._result.hitWall&&!this.onLadder){const g=this._result.wallNormal,x=this.vel.x*g.x+this.vel.z*g.z;x<0&&(this.vel.x-=g.x*x,this.vel.z-=g.z*x)}const p=this.grounded;this._groundProbe(),this.grounded?(this.coyote=Kt.COYOTE_TIME,!p&&!this.onLadder&&this.bus.emit("player:land",{speed:this.vel.y})):this.coyote>0&&(this.coyote-=t),this.speed=this.onLadder?Math.abs(this.vel.y):Math.hypot(this.vel.x,this.vel.z),this.distanceTravelled+=this.speed*t}_tickSlide(t){this.slideTimer+=t;const e=this.terrain.normalAt(this.pos.x,this.pos.z,IM),n=e.x*this.slideDir.x+e.z*this.slideDir.y;n>0&&(this.vel.x+=e.x*Je.SLOPE_ACCEL*t,this.vel.z+=e.z*Je.SLOPE_ACCEL*t);const i=Math.hypot(this.vel.x,this.vel.z),s=n<0?Je.UPHILL_DECAY_MULT:1;if(i>0){const a=i*Je.FRICTION*s*t*.35,l=Math.max(0,i-a)/i;this.vel.x*=l,this.vel.z*=l}const o=Math.hypot(this.vel.x,this.vel.z);(this.slideTimer>=Je.DURATION||o<Je.MIN_SPEED||!this.grounded)&&(this.sliding=!1,this.slideCooldown=Je.COOLDOWN)}_accelerate(t,e,n,i,s=1){if(t.lengthSq()<1e-8)return;const o=this.vel.x*t.x+this.vel.z*t.z,a=e-o;if(a<=0)return;let l=n*i*e*s;l>a&&(l=a),this.vel.x+=t.x*l,this.vel.z+=t.z*l}interpolated(t,e){return e.lerpVectors(this.prevPos,this.pos,t)}}const LM=new P,IM=new P,DM=new P,Ah=new P,NM=new P,OM=new P,UM=new P,fl=Math.PI/180,Zr=Ue.PITCH_CLAMP_DEG*fl;class FM{constructor(t){this.camera=new We(Ue.FOV_BASE,t,Ue.NEAR,Ue.FAR),this.yaw=0,this.pitch=0,this.roll=0,this.smoothEyeY=0,this._initialised=!1,this.fov=Ue.FOV_BASE,this.bobPhase=0,this.recoilPitch=0,this.recoilYaw=0,this._pos=new P,this._euler=new Nn(0,0,0,"YXZ")}setAspect(t){this.camera.aspect=t,this.camera.updateProjectionMatrix()}applyMouse(t,e){this.yaw-=t*Ue.SENSITIVITY,this.pitch-=e*Ue.SENSITIVITY,this.pitch=Qe(this.pitch,-Zr,Zr),this.yaw>Math.PI?this.yaw-=Math.PI*2:this.yaw<-Math.PI&&(this.yaw+=Math.PI*2)}update(t,e,n,i){e.interpolated(n,this._pos);const s=this._pos.y+e.eyeHeight;if(!this._initialised)this.smoothEyeY=s,this._initialised=!0;else{const f=1-Math.exp(-25*t);this.smoothEyeY=ie(this.smoothEyeY,s,f),Math.abs(this.smoothEyeY-s)>1.2&&(this.smoothEyeY=s)}const o=e.sprinting||e.sliding?Ue.FOV_SPRINT:Ue.FOV_BASE,a=o>this.fov?Ue.FOV_UP_TIME:Ue.FOV_DOWN_TIME,l=1-Math.exp(-t/Math.max(1e-4,a/3));this.fov=ie(this.fov,o,l),Math.abs(this.fov-this.camera.fov)>.01&&(this.camera.fov=this.fov,this.camera.updateProjectionMatrix());let c=0,h=0;if(e.grounded&&!e.sliding&&e.speed>.4){this.bobPhase=e.distanceTravelled*Ue.BOB_FREQ_SCALE;const f=Qe(e.speed/Kt.SPEED_WALK,0,Ue.BOB_MAX_INTENSITY)*(e.ads?Ue.BOB_ADS_MULT:1),m=this.bobPhase*Math.PI*2;h=Math.sin(m*2)*Ue.BOB_AMP_VERT*f,c=Math.sin(m)*Ue.BOB_AMP_HORIZ*f}let d=-i*Ue.STRAFE_ROLL_DEG*fl;if(e.sliding){const f=Math.sign(i)||1;d+=-f*Je.CAMERA_ROLL_DEG*fl}const u=1-Math.exp(-9*t);this.roll=ie(this.roll,d,u),this._euler.set(Qe(this.pitch+this.recoilPitch,-Zr,Zr),this.yaw+this.recoilYaw,this.roll),this.camera.quaternion.setFromEuler(this._euler),this.camera.position.set(this._pos.x,this.smoothEyeY+h,this._pos.z),this.camera.translateX(c)}}class BM{constructor(t){this.renderer=t,this.visible=!1,this.el=document.createElement("div"),this.el.id="debug-overlay",this.el.style.display="none",document.body.appendChild(this.el),this.frames=0,this.fps=0,this.minFps=1/0,this.accum=0,this._sampleGrace=1.5}toggle(){this.visible=!this.visible,this.el.style.display=this.visible?"block":"none"}nearestPoi(t,e){const{poi:n,dist:i}=Td(pn,t,e);return n?i<=.5||Eo(n,t,e)?`${n.name} (inside)`:`${n.name} ${i.toFixed(0)}m away`:""}update(t,e,n={}){if(this.frames++,this.accum+=t,this._sampleGrace>0&&(this._sampleGrace-=t),this.accum>=.5&&(this.fps=this.frames/this.accum,this._sampleGrace<=0&&(this.minFps=Math.min(this.minFps,this.fps)),this.frames=0,this.accum=0),!this.visible)return;const i=this.renderer.info,s=e.pos,o=e.mantling?"MANTLE":e.sliding?"SLIDE":e.grounded?e.sprinting?"SPRINT":e.crouching?"CROUCH":e.speed>.3?"WALK":"IDLE":"AIR";this.el.innerHTML=`
      <div class="dbg-row"><b>${this.fps.toFixed(0)} FPS</b> <span class="dim">min ${this.minFps===1/0?"-":this.minFps.toFixed(0)}</span></div>
      <div class="dbg-row">draws <b>${i.render.calls}</b> · tris <b>${(i.render.triangles/1e3).toFixed(0)}k</b></div>
      <div class="dbg-row">geom ${i.memory.geometries} · tex ${i.memory.textures}</div>
      <hr/>
      <div class="dbg-row">pos ${s.x.toFixed(1)}, ${s.y.toFixed(1)}, ${s.z.toFixed(1)}</div>
      <div class="dbg-row">speed <b>${e.speed.toFixed(2)}</b> m/s · vy ${e.vel.y.toFixed(2)}</div>
      <div class="dbg-row">state <b>${o}</b> · h ${e.height.toFixed(2)}</div>
      <div class="dbg-row">${this.nearestPoi(s.x,s.z)}</div>
      <hr/>
      <div class="dbg-row dim">static AABBs ${n.aabbs??"-"} · props ${n.props??"-"}</div>
      <div class="dbg-row dim">seed ${n.seed??"-"}</div>
    `}}function zM(){const r=document.createElement("div");r.id="crosshair",r.innerHTML="<span></span><span></span>",document.body.appendChild(r);const t=document.createElement("div");t.id="interact-prompt",t.style.cssText=["position:fixed","left:50%","bottom:18%","transform:translateX(-50%)","z-index:15","pointer-events:none","display:none","padding:8px 14px","border-radius:6px","background:rgba(8,12,16,0.78)","border:1px solid rgba(127,212,255,0.35)","color:#e8ecf0","font:600 13px/1.2 ui-monospace,Menlo,Consolas,monospace","letter-spacing:0.04em","text-shadow:0 1px 2px rgba(0,0,0,0.8)"].join(";"),document.body.appendChild(t);const e=document.createElement("div");e.id="hint",e.innerHTML=`
    <h1>Call of Booty <small>— Phase 1</small></h1>
    <p class="lead">Click to lock the pointer and drop in.</p>
    <table>
      <tr><td>WASD</td><td>move</td></tr>
      <tr><td>Shift</td><td>sprint</td></tr>
      <tr><td>Space</td><td>jump / mantle</td></tr>
      <tr><td>C or Ctrl</td><td>crouch</td></tr>
      <tr><td>E</td><td>loot / open case / door / elevator</td></tr>
      <tr><td>RMB (sniper)</td><td>scope zoom + reticle</td></tr>
      <tr><td>LMB</td><td>fire</td></tr>
      <tr><td>RMB</td><td>ADS</td></tr>
      <tr><td>R</td><td>reload</td></tr>
      <tr><td>1 / 2 / Q</td><td>weapon slots / quick-swap</td></tr>
      <tr><td>P</td><td>test range (static targets)</td></tr>
      <tr><td>—</td><td>practice bots wander downtown (shootable)</td></tr>
      <tr><td>Sprint + C</td><td>slide (jump to cancel and keep your speed)</td></tr>
      <tr><td>M</td><td>tactical map (your location)</td></tr>
      <tr><td>F3</td><td>performance overlay</td></tr>
      <tr><td>Esc</td><td>release pointer / close map</td></tr>
    </table>
    <p class="err"></p>`,document.body.appendChild(e);const n=e.querySelector(".err");return{setLocked(i){e.style.display=i?"none":"flex",r.style.display=i?"block":"none",i||(t.style.display="none"),i&&(n.textContent="")},setError(i){n.textContent=i},setPrompt(i){if(!i){t.style.display="none";return}t.textContent=i,t.style.display="block"}}}function Js(r){const t=r&16777215;return[t>>16&255,t>>8&255,t&255]}function ii(r,t,e){return r+(t-r)*e|0}class HM{constructor(t){this.terrain=t,this.half=dt.SIZE/2,this.open=!1,this._raster=this._bakeRaster(Pe.RASTER),this._poiById=Object.fromEntries(pn.map(e=>[e.id,e])),this.zoom=Pe.ZOOM_DEFAULT,this.panX=0,this.panZ=0,this._drag=null,this._buildDom(),this._layoutFullMap(),this._bindMapInput(),window.addEventListener("resize",()=>this._layoutFullMap())}_buildDom(){this.miniWrap=document.createElement("div"),this.miniWrap.id="minimap",this.miniWrap.innerHTML=`
      <canvas class="map-canvas"></canvas>
      <div class="map-label">SAN DIEGO</div>
    `,document.body.appendChild(this.miniWrap),this.miniCanvas=this.miniWrap.querySelector("canvas"),this.miniCtx=this.miniCanvas.getContext("2d");const t=Math.min(window.devicePixelRatio||1,2),e=Pe.MINIMAP_SIZE;this.miniCanvas.width=Math.round(e*t),this.miniCanvas.height=Math.round(e*t),this.miniCanvas.style.width=`${e}px`,this.miniCanvas.style.height=`${e}px`,this.miniDpr=t,this.fullWrap=document.createElement("div"),this.fullWrap.id="fullmap",this.fullWrap.style.display="none",this.fullWrap.innerHTML=`
      <div class="fullmap-panel">
        <div class="fullmap-header">
          <span class="fullmap-title">SAN DIEGO — TACTICAL MAP</span>
          <span class="fullmap-hint">Scroll / +− zoom · Drag pan · M / Esc close</span>
        </div>
        <div class="fullmap-stage">
          <canvas class="map-canvas"></canvas>
          <div class="fullmap-zoom">
            <button type="button" class="fullmap-zoom-btn" data-zoom-in title="Zoom in">+</button>
            <button type="button" class="fullmap-zoom-btn" data-zoom-out title="Zoom out">−</button>
          </div>
        </div>
        <div class="fullmap-footer">
          <span class="fullmap-coords"></span>
          <span class="fullmap-nearest"></span>
        </div>
      </div>
    `,document.body.appendChild(this.fullWrap),this.fullCanvas=this.fullWrap.querySelector("canvas"),this.fullCtx=this.fullCanvas.getContext("2d"),this.fullCoords=this.fullWrap.querySelector(".fullmap-coords"),this.fullNearest=this.fullWrap.querySelector(".fullmap-nearest"),this.fullDpr=t}_bindMapInput(){var s,o;const t=this.fullWrap,e=this.fullCanvas;e.style.cursor="grab",e.style.touchAction="none";const n=a=>{if(!this.open)return;a.preventDefault(),a.stopPropagation();const l=e.getBoundingClientRect();let c=a.clientX-l.left,h=a.clientY-l.top;(c<0||h<0||c>l.width||h>l.height)&&(c=l.width*.5,h=l.height*.5);const d=this._canvasToWorld(c,h),u=a.deltaY>0?1-Pe.ZOOM_WHEEL:1+Pe.ZOOM_WHEEL;this.zoom=Math.min(Pe.ZOOM_MAX,Math.max(Pe.ZOOM_MIN,this.zoom*u));const f=this._canvasToWorld(c,h);this.panX+=d.x-f.x,this.panZ+=d.z-f.z,this._clampPan()};window.addEventListener("wheel",n,{passive:!1,capture:!0}),t.addEventListener("wheel",n,{passive:!1}),e.addEventListener("wheel",n,{passive:!1}),e.addEventListener("pointerdown",a=>{this.open&&(a.preventDefault(),e.setPointerCapture(a.pointerId),this._drag={x:a.clientX,y:a.clientY,panX:this.panX,panZ:this.panZ},e.style.cursor="grabbing")}),e.addEventListener("pointermove",a=>{if(!this._drag||!this.open)return;const l=e.getBoundingClientRect(),c=this._viewWorldSize()/Math.max(1,l.width),h=(a.clientX-this._drag.x)*c,d=(a.clientY-this._drag.y)*c;this.panX=this._drag.panX-h,this.panZ=this._drag.panZ-d,this._clampPan()});const i=()=>{this._drag=null,e.style.cursor="grab"};e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("pointerleave",i),(s=t.querySelector("[data-zoom-in]"))==null||s.addEventListener("click",a=>{a.stopPropagation(),this._zoomBy(1+Pe.ZOOM_WHEEL*2)}),(o=t.querySelector("[data-zoom-out]"))==null||o.addEventListener("click",a=>{a.stopPropagation(),this._zoomBy(1-Pe.ZOOM_WHEEL*2)}),window.addEventListener("keydown",a=>{this.open&&(a.code==="Equal"||a.code==="NumpadAdd"?(a.preventDefault(),this._zoomBy(1.2)):(a.code==="Minus"||a.code==="NumpadSubtract")&&(a.preventDefault(),this._zoomBy(1/1.2)))})}_zoomBy(t){const e=this.fullCanvas.getBoundingClientRect(),n=e.width*.5,i=e.height*.5,s=this._canvasToWorld(n,i);this.zoom=Math.min(Pe.ZOOM_MAX,Math.max(Pe.ZOOM_MIN,this.zoom*t));const o=this._canvasToWorld(n,i);this.panX+=s.x-o.x,this.panZ+=s.z-o.z,this._clampPan()}_viewWorldSize(){return dt.SIZE/Math.max(1,this.zoom)}_clampPan(){const t=this._viewWorldSize()/2,e=this.half-t;if(e<=0){this.panX=0,this.panZ=0;return}this.panX=Math.max(-e,Math.min(e,this.panX)),this.panZ=Math.max(-e,Math.min(e,this.panZ))}_canvasToWorld(t,e){const n=this.fullSide||1,i=this._viewWorldSize(),s=this.panX-i/2,o=this.panZ-i/2;return{x:s+t/n*i,z:o+e/n*i}}_layoutFullMap(){const t=this.fullDpr,e=Pe.FULL_MAP_MAX,n=Math.min(e,Math.floor(window.innerWidth*.72),Math.floor(window.innerHeight*.72));this.fullSide=n,this.fullCanvas.width=Math.round(n*t),this.fullCanvas.height=Math.round(n*t),this.fullCanvas.style.width=`${n}px`,this.fullCanvas.style.height=`${n}px`}_bakeRaster(t){const e=document.createElement("canvas");e.width=t,e.height=t;const n=e.getContext("2d"),i=n.createImageData(t,t),s=i.data,o=this.half,a=dt.SIZE,l=dt.WATER_LEVEL,c=Js(hs.SAND),h=Js(hs.GRASS),d=Js(hs.DRY_GRASS),u=Js(hs.CHAPARRAL),f=Js(hs.ROCK),m=[26,74,92],_=[48,49,52],p=[62,63,66];for(let g=0;g<t;g++){const x=-o+(g+.5)/t*a;for(let M=0;M<t;M++){const y=-o+(M+.5)/t*a,A=this.terrain.heightAt(y,x),w=(g*t+M)*4;let E,L,U;if(A<l+.15){const v=Math.min(1,Math.max(0,(l-A)/12));E=ii(m[0],10,v),L=ii(m[1],40,v),U=ii(m[2],55,v)}else{const v=this.terrain.roadAt(y,x);if(v>.25){const S=Math.min(1,(v-.25)/.55);E=ii(p[0],_[0],S),L=ii(p[1],_[1],S),U=ii(p[2],_[2],S)}else{let S;A<4?S=c:A<28?S=h:A<48?S=d:A<95?S=u:S=f,E=S[0],L=S[1],U=S[2];const I=this.terrain.slopeDegAt(y,x);if(I>28){const D=Math.min(1,(I-28)/30);E=ii(E,f[0],D*.7),L=ii(L,f[1],D*.7),U=ii(U,f[2],D*.7)}}}s[w]=E,s[w+1]=L,s[w+2]=U,s[w+3]=255}}return n.putImageData(i,0,0),e}worldToViewPx(t,e,n){const i=this._viewWorldSize(),s=this.panX-i/2,o=this.panZ-i/2;return{px:(t-s)/i*n,py:(e-o)/i*n}}toggle(){return this.setOpen(!this.open),this.open}setOpen(t){this.open=t,this.fullWrap.style.display=t?"flex":"none",this.fullWrap.style.pointerEvents=t?"auto":"none",this.fullWrap.classList.toggle("is-open",t),t?(typeof document<"u"&&document.pointerLockElement&&(this._suppressLockClose=!0,document.exitPointerLock(),setTimeout(()=>{this._suppressLockClose=!1},0)),this._lastPos&&(this.panX=this._lastPos.x,this.panZ=this._lastPos.z,this._clampPan()),this.zoom<1.5&&(this.zoom=2.5),this._clampPan()):this._suppressLockClose=!1}nearestPoi(t,e){const{poi:n,dist:i}=Td(pn,t,e);return n?i<=.5||Eo(n,t,e)?`IN ${n.name.toUpperCase()}`:`${n.name} · ${i.toFixed(0)} m`:""}update(t,e){this._lastPos=t,this._drawMinimap(t,e),this.open&&this._drawFullMap(t,e)}_drawMinimap(t,e){const n=this.miniCtx,i=this.miniDpr,s=this.miniCanvas.width,o=Pe.MINIMAP_RANGE,a=o/2;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,s,s);const l=(t.x-a+this.half)/dt.SIZE*this._raster.width,c=(t.z-a+this.half)/dt.SIZE*this._raster.height,h=o/dt.SIZE*this._raster.width,d=o/dt.SIZE*this._raster.height;n.imageSmoothingEnabled=!0,n.drawImage(this._raster,l,c,h,d,0,0,s,s);const u=(f,m)=>({px:(f-(t.x-a))/o*s,py:(m-(t.z-a))/o*s});this._drawBuildings(n,u,{minPx:1.5,stroke:!1,alpha:.55}),this._drawPois(n,u,3.2*i,!1),this._drawPlayer(n,s/2,s/2,e,7*i)}_drawFullMap(t,e){const n=this.fullCtx,i=this.fullCanvas.width,s=this.fullDpr,o=this._viewWorldSize(),a=this.panX-o/2,l=this.panZ-o/2;n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,i,i),n.imageSmoothingEnabled=this.zoom<4;const c=(a+this.half)/dt.SIZE*this._raster.width,h=(l+this.half)/dt.SIZE*this._raster.height,d=o/dt.SIZE*this._raster.width,u=o/dt.SIZE*this._raster.height;n.drawImage(this._raster,c,h,d,u,0,0,i,i);const f=(_,p)=>this.worldToViewPx(_,p,i);this._drawBuildings(n,f,{minPx:this.zoom<2?1.2:.8,stroke:this.zoom>=1.8,alpha:.82,detailed:!0}),this._drawPois(n,f,Math.max(3,4.5*s*Math.min(2,Math.sqrt(this.zoom))),!0);const m=f(t.x,t.z);this._drawPlayer(n,m.px,m.py,e,8*s*Math.min(1.6,Math.sqrt(this.zoom))),n.strokeStyle=Pe.BORDER,n.lineWidth=2*s,n.strokeRect(1,1,i-2,i-2),this.fullCoords.textContent=`${t.x.toFixed(0)}, ${t.z.toFixed(0)}  ·  ${this._headingLabel(e)}  ·  ×${this.zoom.toFixed(1)}`,this.fullNearest.textContent=this.nearestPoi(t.x,t.z)}_drawBuildings(t,e,n={}){const i=Ps;if(!(i!=null&&i.length))return;const s=n.minPx??1,o=!!n.stroke,a=n.alpha??.75,l=!!n.detailed,c=this.fullDpr||this.miniDpr||1;t.lineWidth=Math.max(.6,.9*c),t.strokeStyle="rgba(200, 220, 240, 0.45)";for(const h of i){if(!(h.w>0)||!(h.d>0))continue;const d=e(h.x,h.z),u=e(h.x+h.w,h.z+h.d),f=Math.min(d.px,u.px),m=Math.min(d.py,u.py);let _=Math.abs(u.px-d.px),p=Math.abs(u.py-d.py);if(_<s&&p<s&&(_=Math.max(_,s),p=Math.max(p,s)),!(_<.4||p<.4)){if(l&&h.floors>1){const g=Math.min(1,(h.floors-1)/16),x=55+g*55|0,M=70+g*70|0,y=95+g*80|0;t.fillStyle=`rgba(${x}, ${M}, ${y}, ${a})`}else t.fillStyle=`rgba(72, 82, 98, ${a})`;t.fillRect(f,m,_,p),o&&_>2.5&&t.strokeRect(f,m,_,p)}}}_headingLabel(t){let e=-t*180/Math.PI%360;e<0&&(e+=360);const n=["N","NE","E","SE","S","SW","W","NW"],i=Math.round(e/45)%8;return`${n[i]} ${e.toFixed(0)}°`}_drawPois(t,e,n,i){for(const s of pn){const{px:o,py:a}=e(s.x,s.z);if(t.beginPath(),t.arc(o,a,n*(i?1.1:.9),0,Math.PI*2),t.fillStyle=Pe.POI,t.fill(),t.strokeStyle="rgba(0,0,0,0.6)",t.lineWidth=Math.max(1,n*.22),t.stroke(),i){t.font=`600 ${Math.max(11,11*(this.fullDpr||1)*Math.min(1.4,Math.sqrt(this.zoom)))}px ui-monospace, Menlo, Consolas, monospace`,t.fillStyle=Pe.POI_TEXT,t.strokeStyle="rgba(0,0,0,0.75)",t.lineWidth=3*(this.fullDpr||1),t.textAlign="center",t.textBaseline="bottom";const l=s.name.toUpperCase();t.strokeText(l,o,a-n*1.6-4*(this.fullDpr||1)),t.fillText(l,o,a-n*1.6-4*(this.fullDpr||1))}}}_drawPlayer(t,e,n,i,s){t.save(),t.translate(e,n),t.rotate(i),t.beginPath(),t.moveTo(0,-s*1.4),t.lineTo(s*.9,s*1.1),t.lineTo(0,s*.45),t.lineTo(-s*.9,s*1.1),t.closePath(),t.fillStyle=Pe.PLAYER,t.fill(),t.strokeStyle="rgba(0,0,0,0.55)",t.lineWidth=Math.max(1,s*.18),t.stroke(),t.beginPath(),t.arc(0,0,s*1.7,0,Math.PI*2),t.strokeStyle=Pe.PLAYER_RING,t.lineWidth=Math.max(1,s*.25),t.stroke(),t.restore()}}class GM{constructor(t,e){this.scene=t,this.camera=e,this.group=new $t,this.group.name="fx",t.add(this.group),this.tracers=[],this.impacts=[],this.casings=[],this.numbers=[],this.hitmarker={t:0,head:!1},this.hmEl=document.createElement("div"),this.hmEl.id="hitmarker",this.hmEl.style.cssText=["position:fixed","left:50%","top:50%","transform:translate(-50%,-50%)","width:18px","height:18px","pointer-events:none","z-index:12","opacity:0","transition:opacity 0.05s"].join(";"),this.hmEl.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M2 2 L7 7 M16 2 L11 7 M2 16 L7 11 M16 16 L11 11"
          stroke="#fff" stroke-width="2" fill="none" id="hm-path"/>
      </svg>`,document.body.appendChild(this.hmEl),this.dmgLayer=document.createElement("div"),this.dmgLayer.id="dmg-numbers",this.dmgLayer.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:11;overflow:hidden",document.body.appendChild(this.dmgLayer),this._lineMat=new Ll({color:16769184,transparent:!0,opacity:.55,linewidth:1}),this._brassGeo=new un(.004,.0045,.018,5),this._brassMat=new _e({color:12886096,metalness:.85,roughness:.35,emissive:2232576,emissiveIntensity:.15}),this._bulletGeo=new Yi(.05,6,6),this._flashLight=new Nl(16764040,0,12,2),this.group.add(this._flashLight),this._flashLightT=0}spawnBallisticTrace(t,e,n={}){if(!t||!e||t.distanceToSquared(e)<1e-5)return;const i=!!n.bright,s=new Ye().setFromPoints([t.clone(),e.clone()]),o=this._lineMat.clone();o.opacity=i?.92:.5,o.color=new Lt(i?16769168:16773312);const a=new mr(s,o);this.group.add(a),this.tracers.push({line:a,mat:o,life:n.life??(i?.45:.1)})}createBulletMesh(t=!1){const e=new ln({color:t?16773800:16771264,transparent:!0,opacity:t?1:.8,depthWrite:!1}),n=new ht(this._bulletGeo,e);return n.scale.setScalar(t?1.8:1),n.frustumCulled=!1,this.group.add(n),n}releaseBulletMesh(t){t&&(this.group.remove(t),t.material&&t.material.dispose())}spawnMuzzleBloom(t,e=1){this._flashLight.position.copy(t),this._flashLight.intensity=6*e,this._flashLightT=.08+.05*e}spawnTracer(t,e,n={}){const i=e.clone().sub(t),s=i.length();if(s<.2)return;i.normalize();const o=n.long?55:18,a=s>o?t.clone().addScaledVector(i,s-o):t.clone(),l=new Ye().setFromPoints([a,e.clone()]),c=this._lineMat.clone();c.opacity=n.long?.9:.55,c.color=new Lt(n.long?16769168:16769184);const h=new mr(l,c);this.group.add(h),this.tracers.push({line:h,mat:c,life:n.long?.25:Gn.TRACER_LIFE*.9})}spawnImpact(t,e="solid"){const n=e==="thin"||e==="glass"?11065584:e==="target"?16732240:13154448,i=new ht(new Yi(.02,5,5),new ln({color:n,transparent:!0,opacity:.9}));i.position.copy(t),this.group.add(i),this.impacts.push({mesh:i,life:.14,max:.14})}spawnGlassBreak(t){for(let n=0;n<6;n++){const i=new ht(new Pt(.04,.04,.01),new ln({color:10146032,transparent:!0,opacity:.85}));i.position.copy(t),i.position.x+=(Math.random()-.5)*.15,i.position.y+=(Math.random()-.5)*.15,i.position.z+=(Math.random()-.5)*.15,this.group.add(i);const s=new P((Math.random()-.5)*3.5,1.2+Math.random()*2.2,(Math.random()-.5)*3.5);this.impacts.push({mesh:i,life:.35,max:.35,vel:s})}}spawnCasing(t,e,n,i){if(this.casings.length>24){const l=this.casings.shift();this.group.remove(l.mesh)}const s=new ht(this._brassGeo,this._brassMat);s.position.copy(t),s.position.addScaledVector(e,.08),s.position.addScaledVector(n,.02),s.position.addScaledVector(i,-.05),this.group.add(s);const o=new P().addScaledVector(e,1.6+Math.random()*.8).addScaledVector(n,.9+Math.random()*.5).addScaledVector(i,-.3+Math.random()*.2),a=new P((Math.random()-.5)*18,(Math.random()-.5)*18,(Math.random()-.5)*18);this.casings.push({mesh:s,vel:o,spin:a,life:.55})}showHitmarker(t){this.hitmarker.t=Gn.HITMARKER_TIME,this.hitmarker.head=t;const e=this.hmEl.querySelector("#hm-path");e&&e.setAttribute("stroke",t?"#ff4040":"#ffffff"),this.hmEl.style.opacity="1"}spawnDamageNumber(t,e,n){const i=document.createElement("div");i.textContent=String(Math.round(e)),i.style.cssText=["position:absolute","transform:translate(-50%,-50%)","font:700 14px/1 ui-monospace,Menlo,monospace",`color:${n?"#ff6060":"#ffe8a0"}`,"text-shadow:0 1px 2px #000","opacity:1","pointer-events:none"].join(";"),this.dmgLayer.appendChild(i),this.numbers.push({el:i,world:t.clone(),life:Gn.DAMAGE_NUM_LIFE,max:Gn.DAMAGE_NUM_LIFE})}update(t){this._flashLightT>0&&(this._flashLightT-=t,this._flashLight.intensity=Math.max(0,this._flashLight.intensity-t*70),this._flashLightT<=0&&(this._flashLight.intensity=0));for(let n=this.tracers.length-1;n>=0;n--){const i=this.tracers[n];i.life-=t;const s=i.life+t;i.mat.opacity=Math.max(0,i.mat.opacity*(i.life/Math.max(1e-4,s))),i.life<=0&&(this.group.remove(i.line),i.line.geometry.dispose(),i.mat.dispose(),this.tracers.splice(n,1))}for(let n=this.impacts.length-1;n>=0;n--){const i=this.impacts[n];i.life-=t,i.vel&&(i.mesh.position.addScaledVector(i.vel,t),i.vel.y-=12*t);const s=1-i.life/i.max;i.mesh.scale.setScalar(1+s*1.5),i.mesh.material.opacity=Math.max(0,1-s),i.life<=0&&(this.group.remove(i.mesh),i.mesh.geometry.dispose(),i.mesh.material.dispose(),this.impacts.splice(n,1))}for(let n=this.casings.length-1;n>=0;n--){const i=this.casings[n];i.life-=t,i.vel.y-=12*t,i.mesh.position.addScaledVector(i.vel,t),i.mesh.rotation.x+=i.spin.x*t,i.mesh.rotation.y+=i.spin.y*t,i.mesh.rotation.z+=i.spin.z*t,i.life<=0&&(this.group.remove(i.mesh),this.casings.splice(n,1))}this.hitmarker.t>0&&(this.hitmarker.t-=t,this.hitmarker.t<=0&&(this.hmEl.style.opacity="0"));const e=this.camera;for(let n=this.numbers.length-1;n>=0;n--){const i=this.numbers[n];i.life-=t,i.world.y+=t*.8;const s=i.world.clone().project(e),o=(s.x*.5+.5)*window.innerWidth,a=(-s.y*.5+.5)*window.innerHeight;i.el.style.left=`${o}px`,i.el.style.top=`${a}px`,i.el.style.opacity=String(Math.max(0,i.life/i.max)),(i.life<=0||s.z>1)&&(i.el.remove(),this.numbers.splice(n,1))}}}const kM=new Ad,wh={ar:{scale:1,offset:new P(0,-.01,0)},smg:{scale:1.05,offset:new P(0,-.01,0)},lmg:{scale:.95,offset:new P(0,-.01,0)},sniper:{scale:.95,offset:new P(0,-.02,0)},dmr:{scale:1,offset:new P(0,-.01,0)},shotgun:{scale:1,offset:new P(0,-.01,0)},pistol:{scale:1.2,offset:new P(0,0,0)}};async function VM(r="/assets/weapons_catalog.json"){const t={};let e={weapons:{}};try{const i=await fetch(r);if(!i.ok)return console.warn("[weapons] catalog missing",r),{byClass:t,catalog:e};e=await i.json()}catch(i){return console.warn("[weapons] catalog fetch failed",i),{byClass:t,catalog:e}}const n=Object.entries(e.weapons||{});return await Promise.all(n.map(async([i,s])=>{const o="/"+String(s.glb||"").replace(/^\/?/,"");try{const l=(await kM.loadAsync(o)).scene;l.traverse(c=>{var h,d;if(c.isMesh){c.frustumCulled=!1,c.renderOrder=999,c.castShadow=!1,c.receiveShadow=!1;const u=(c.name||"").toLowerCase();if((u.includes("optic_body")||u==="opticbody"||u.includes("brake")||u.includes("muzzle_dev")||u.includes("ocular_glass")||u==="glass")&&(c.visible=!1),c.material){const f=Array.isArray(c.material)?c.material:[c.material];for(const m of f)m.isMeshStandardMaterial&&(m.envMapIntensity=.8,(u.includes("glass")||u.includes("optic"))&&(m.transparent=!0,m.opacity=.06,m.depthWrite=!1,m.metalness=.05,m.roughness=.1,(d=(h=m.emissive)==null?void 0:h.setHex)==null||d.call(h,0)),m.needsUpdate=!0)}}c.frustumCulled=!1}),t[i]=l}catch(a){console.warn(`[weapons] failed to load ${i}`,a.message||a)}})),console.info(`[weapons] loaded ${Object.keys(t).length}/${n.length} viewmodel GLBs`),{byClass:t,catalog:e}}function kl(r){return r==="ar"?"ar":r==="smg"?"smg":r==="lmg"?"lmg":r==="sniper"?"sniper":r==="dmr"?"dmr":r==="shotgun"?"shotgun":r==="pistol"?"pistol":"ar"}function Qs(r,t,e=new P){return t.getWorldPosition(e),r.worldToLocal(e),e}function WM(r,t){var u;const e=new $t;e.name=`vm_${r.id}_glb`,e.frustumCulled=!1;const n=new $t;n.name="glbPivot",e.add(n);const i=t.clone(!0);i.name="glbWeapon";const s=[];i.traverse(f=>{(f.isLight||f.isCamera)&&s.push(f)});for(const f of s)(u=f.parent)==null||u.remove(f);n.add(i);let o=null,a=null,l=null;if(i.traverse(f=>{var _,p;const m=(f.name||"").toLowerCase();if((m==="mag"||m==="magazine")&&f.isMesh&&(o=f),m==="muzzle"&&(a=f),m==="sight"&&(l=f),f.isMesh){f.frustumCulled=!1,f.renderOrder=999;const g=Array.isArray(f.material)?f.material:f.material?[f.material]:[];for(const x of g)x&&(x.map&&((p=(_=x.color)==null?void 0:_.multiplyScalar)==null||p.call(_,.85)),x.depthTest=!0,x.depthWrite=!0,x.needsUpdate=!0)}}),e.updateMatrixWorld(!0),a&&l){const f=Qs(e,a),m=Qs(e,l),_=f.x-m.x,p=f.z-m.z,g=Math.atan2(_,-p);Math.abs(g)>.05&&(n.rotation.y-=g,e.updateMatrixWorld(!0))}else a&&Qs(e,a).z>.02&&(n.rotation.y+=Math.PI,e.updateMatrixWorld(!0));if(l){e.updateMatrixWorld(!0);const f=Qs(e,l);n.position.sub(f),e.updateMatrixWorld(!0)}const c=wh[kl(r.class)]||wh.ar;n.scale.setScalar(c.scale),n.position.add(c.offset),e.updateMatrixWorld(!0);const h=new $t;h.name="mag",o&&(h.userData.magMesh=o),e.add(h);const d=new he;return d.name="muzzle",a?d.position.copy(Qs(e,a)):d.position.set(0,-.02,-.55),e.add(d),{root:e,mag:h,muzzle:d,hasScope:!!(r.scopeOverlay||r.class==="sniper"||r.class==="dmr"),source:"glb"}}function vi(r,t={}){return new _e({color:r,roughness:t.rough??.42,metalness:t.metal??.45,emissive:new Lt(r).multiplyScalar(t.em??.1),emissiveIntensity:1,transparent:!!t.alpha,opacity:t.alpha??1,depthWrite:!t.alpha})}function _t(r,t,e,n,i,s,o,a,l=0,c=0,h=0){const d=new ht(new Pt(t,e,n),i);return d.position.set(s,o,a),d.rotation.set(l,c,h),d.frustumCulled=!1,d.renderOrder=999,r.add(d),d}function wn(r,t,e,n,i,s,o,a,l=0,c=0,h=0,d=12){const u=new ht(new un(t,e,n,d),i);return u.position.set(s,o,a),u.rotation.set(l,c,h),u.frustumCulled=!1,u.renderOrder=999,r.add(u),u}function ga(r,t,e,n,i,s=.02){_t(r,.0035,.011,.0035,t,0,s+.0055,n),_t(r,.0045,.008,.0035,e,-.007,s+.004,i),_t(r,.0045,.008,.0035,e,.007,s+.004,i),_t(r,.018,.0025,.0035,e,0,s,i)}function XM(r,t,e,n,i=-.04,s=.03){_t(r,.032,.012,.04,t,0,s-.012,i),_t(r,.03,.0025,.0025,t,0,s+.014,i+.01),_t(r,.03,.0025,.0025,t,0,s-.014,i+.01),_t(r,.0025,.028,.0025,t,-.014,s,i+.01),_t(r,.0025,.028,.0025,t,.014,s,i+.01),_t(r,.004,.004,.003,n,0,s,i+.008)}function YM(r,t,e,n,i,s=-.06){wn(r,.02,.02,.2,t,0,.03,s,Math.PI/2,0,0,14),wn(r,.022,.016,.035,t,0,.03,s+.11,Math.PI/2,0,0,12),_t(r,.028,.028,.008,e,0,.03,s+.128),wn(r,.016,.024,.04,t,0,.03,s-.11,Math.PI/2,0,0,12),_t(r,.034,.034,.006,e,0,.03,s-.132),_t(r,.006,.006,.006,n,0,.03,s),_t(r,.022,.016,.022,i,0,.01,s+.05),_t(r,.022,.016,.022,i,0,.01,s-.05)}function qM(r,t=null){if(t)try{return WM(r,t)}catch(_){console.warn("[viewmodel] GLB build failed, using procedural",r.id,_)}const e=new $t;e.name=`vm_${r.id}`,e.frustumCulled=!1;const n=new $t;n.name="mag",n.frustumCulled=!1,e.add(n);const i=vi(r.color,{rough:.48,metal:.3,em:.12}),s=vi(1842724,{rough:.5,metal:.55,em:.07}),o=vi(11581120,{rough:.25,metal:.82,em:.08}),a=vi(7228464,{rough:.72,metal:.04,em:.08}),l=vi(921620,{rough:.55,metal:.4,em:.05}),c=vi(16724016,{rough:.25,metal:.1,em:.9}),h=vi(4882592,{rough:.12,metal:.15,em:.22,alpha:.4}),d=vi(12886138,{rough:.85,metal:.03,em:.1}),u=r.class;let f=new P(0,-.02,-.55);u==="pistol"?(_t(e,.055,.05,.2,o,0,-.02,-.1),_t(e,.05,.035,.15,s,0,-.05,-.06),_t(e,.048,.12,.06,s,0,-.12,0,.2,0,0),wn(e,.012,.012,.08,o,0,-.015,-.24,Math.PI/2,0,0),_t(n,.04,.1,.05,i,0,-.14,0),_t(e,.012,.035,.045,s,0,-.08,-.04),ga(e,c,l,-.18,-.02,.01),_t(e,.05,.05,.08,d,.01,-.14,.02),f.set(0,-.015,-.28)):u==="shotgun"?(_t(e,.05,.055,.14,a,0,-.04,.1),_t(e,.06,.055,.28,s,0,-.03,-.1),_t(e,.055,.05,.16,a,0,-.035,-.28),wn(e,.016,.016,.32,o,0,-.015,-.42,Math.PI/2,0,0),wn(e,.014,.014,.28,o,0,-.04,-.38,Math.PI/2,0,0),_t(n,.05,.05,.1,i,0,-.07,-.2),_t(e,.008,.018,.008,c,0,.02,-.3),_t(e,.05,.11,.055,s,0,-.11,.02,.22,0,0),_t(e,.05,.05,.08,d,0,-.13,.04),_t(e,.05,.05,.07,d,0,-.07,-.24),f.set(0,-.015,-.58)):u==="sniper"?(_t(e,.05,.05,.16,a,0,-.045,.12),_t(e,.055,.05,.3,s,0,-.035,-.08),_t(e,.05,.045,.2,s,0,-.035,-.3),wn(e,.012,.012,.4,o,0,-.02,-.52,Math.PI/2,0,0),_t(e,.02,.02,.035,o,0,-.02,-.72),_t(e,.028,.012,.2,l,0,-.005,-.08),YM(e,l,h,c,o,-.06),_t(n,.04,.1,.05,i,0,-.12,-.04),_t(e,.048,.11,.05,s,0,-.12,.04,.2,0,0),_t(e,.048,.048,.07,d,0,-.14,.05),_t(e,.048,.048,.065,d,0,-.07,-.24),f.set(0,-.02,-.75)):u==="smg"?(_t(e,.055,.05,.22,i,0,-.035,-.08),_t(e,.05,.03,.18,s,0,-.01,-.1),wn(e,.012,.012,.16,o,0,-.02,-.3,Math.PI/2,0,0),_t(e,.04,.04,.1,s,0,-.02,-.22),_t(e,.048,.11,.055,s,0,-.12,.02,.22,0,0),_t(n,.04,.12,.05,i,0,-.14,-.05),_t(e,.04,.04,.1,s,0,-.04,.12),_t(e,.025,.01,.14,l,0,.01,-.08),ga(e,c,l,-.18,0,.02),_t(e,.048,.048,.07,d,0,-.14,.04),_t(e,.048,.048,.065,d,0,-.07,-.18),f.set(0,-.02,-.38)):u==="lmg"?(_t(e,.065,.055,.34,s,0,-.04,-.1),wn(e,.014,.014,.34,o,0,-.02,-.42,Math.PI/2,0,0),_t(e,.01,.08,.01,o,-.035,-.1,-.34),_t(e,.01,.08,.01,o,.035,-.1,-.34),_t(n,.07,.13,.08,i,0,-.14,-.05),_t(e,.05,.11,.055,s,0,-.13,.06,.2,0,0),_t(e,.05,.05,.14,s,0,-.04,.14),_t(e,.03,.012,.18,l,0,0,-.06),ga(e,c,l,-.22,.02,.015),_t(e,.05,.05,.07,d,0,-.15,.07),_t(e,.05,.05,.065,d,0,-.08,-.2),f.set(0,-.02,-.6)):(_t(e,.045,.05,.14,s,0,-.04,.14),wn(e,.015,.015,.1,l,0,-.035,.04,Math.PI/2,0,0),_t(e,.055,.05,.16,i,0,-.05,-.02),_t(e,.05,.042,.18,s,0,-.02,-.05),_t(e,.048,.042,.2,s,0,-.025,-.24),wn(e,.01,.01,.2,o,0,-.015,-.42,Math.PI/2,0,0),_t(e,.018,.018,.025,o,0,-.015,-.32),_t(e,.022,.022,.035,o,0,-.015,-.54),_t(e,.028,.012,.22,l,0,.01,-.1),XM(e,s,h,c,-.04,.035),_t(e,.006,.014,.006,l,0,.02,-.32),_t(e,.045,.12,.05,s,0,-.13,.02,.28,0,0),_t(e,.045,.025,.055,o,0,-.08,-.04),_t(n,.042,.13,.05,i,0,-.16,-.04),_t(e,.05,.05,.075,d,0,-.15,.04),_t(e,.05,.05,.07,d,0,-.07,-.2),f.set(0,-.015,-.58));const m=new he;return m.position.copy(f),e.add(m),e.scale.setScalar(1.05),e.position.set(0,0,0),e.rotation.set(0,0,0),e.traverse(_=>{_.isMesh&&(_.frustumCulled=!1,_.renderOrder=999)}),{root:e,mag:n,muzzle:m,hasScope:u==="sniper",source:"procedural"}}const Jr=new he;function bh(r,t=null,e=null){if(!r||r.tag!=="glass"||r.disabled)return!1;r.disabled=!0;const n=r.userData;return(n==null?void 0:n.mesh)!=null&&n.instanceId!=null&&(Jr.position.set(0,-9999,0),Jr.scale.set(0,0,0),Jr.updateMatrix(),n.mesh.setMatrixAt(n.instanceId,Jr.matrix),n.mesh.instanceMatrix.needsUpdate=!0),t!=null&&t.spawnGlassBreak&&e?t.spawnGlassBreak(e):t!=null&&t.spawnImpact&&e&&t.spawnImpact(e,"glass"),!0}const Qr=new P;new P;new P;function pl(r,t,e,n,i=1e6){Qr.set(t.x!==0?1/t.x:1e12,t.y!==0?1/t.y:1e12,t.z!==0?1/t.z:1e12);let s=0,o=i;for(let a=0;a<3;a++){const l=a===0?r.x:a===1?r.y:r.z,c=a===0?Qr.x:a===1?Qr.y:Qr.z,h=a===0?e.x:a===1?e.y:e.z,d=a===0?n.x:a===1?n.y:n.z;let u=(h-l)*c,f=(d-l)*c;if(u>f){const m=u;u=f,f=m}if(u>s&&(s=u),f<o&&(o=f),s>o||o<0)return null}return s>=0?s:o>=0?0:null}function KM(r,t){if(r<=t.falloffStart)return 1;if(r>=t.falloffEnd)return t.falloffMinMult;const e=(r-t.falloffStart)/Math.max(1e-4,t.falloffEnd-t.falloffStart);return 1+(t.falloffMinMult-1)*e}function jM(r,t){return r==="head"?t.headMult:r==="arm"||r==="leg"?t.limbMult:1}const $M=new P,_a=[],ZM=18.5;class JM{constructor(t,e,n){this.hash=t,this.effects=e,this.bus=n,this.projectiles=[]}fire({origin:t,dir:e,speed:n,damage:i,def:s,rar:o,targetRange:a,maxDist:l=450}){var u,f;const c=e.clone().normalize().multiplyScalar(n),h=s.class==="sniper"||s.class==="dmr",d=((f=(u=this.effects)==null?void 0:u.createBulletMesh)==null?void 0:f.call(u,h))||null;d&&d.position.copy(t),this.projectiles.push({pos:t.clone(),vel:c,prev:t.clone(),age:0,pathDist:0,maxLife:l/Math.max(80,n)+.85,damage:i,def:s,rar:o,targetRange:a,speed:n,longRange:h,mesh:d,trailAcc:0,effectiveRange:s.effectiveRange??80,rangeScatterDeg:s.rangeScatterDeg??0})}_killProjectile(t){var n,i;const e=this.projectiles[t];e!=null&&e.mesh&&((i=(n=this.effects)==null?void 0:n.releaseBulletMesh)==null||i.call(n,e.mesh)),this.projectiles.splice(t,1)}update(t,e){var i,s;if(t<=0)return;const n=1.2;for(let o=this.projectiles.length-1;o>=0;o--){const a=this.projectiles[o];if(a.age+=t,a.age>a.maxLife){this._killProjectile(o);continue}a.vel.y-=ZM*(a.def.dropScale??1)*t;let l=t,c=!1;const h=a.pos.clone();for(;l>1e-5&&!c;){const d=a.vel.length();if(d<1){this._killProjectile(o),c=!0;break}const u=d*l,f=Math.min(n,u),m=f/d,_=$M.copy(a.vel).multiplyScalar(1/d);if(a.rangeScatterDeg>0&&a.pathDist>a.effectiveRange){const x=a.pathDist-a.effectiveRange,y=a.rangeScatterDeg/100*f*(.4+Math.random()*.9)*(Math.PI/180)*Math.min(3,1+x/40),A=(Math.random()-.5)*2*y,w=(Math.random()-.5)*2*y,E=a.vel.length(),L=new P().crossVectors(_,new P(0,1,0));L.lengthSq()<1e-8?L.set(1,0,0):L.normalize(),a.vel.applyAxisAngle(new P(0,1,0),A),a.vel.applyAxisAngle(L,w),a.vel.setLength(E),_.copy(a.vel).multiplyScalar(1/E)}a.prev.copy(a.pos);const p=a.pos.clone().addScaledVector(_,f),g=this._segmentHit(a.prev,p,_,f,e);if(g){a.pathDist+=g.t,this._resolveHit(a,g),this._killProjectile(o),c=!0;break}a.pathDist+=f,a.pos.copy(p),l-=m}c||((s=(i=this.effects)==null?void 0:i.spawnBallisticTrace)==null||s.call(i,h,a.pos,{bright:a.longRange,life:a.longRange?.35:.12}),a.mesh&&(a.mesh.position.copy(a.pos),a.vel.length()>1&&(a.mesh.lookAt(a.pos.clone().add(a.vel)),a.mesh.scale.set(a.longRange?1.2:.8,a.longRange?1.2:.8,a.longRange?2.8:1.6))))}}_segmentHit(t,e,n,i,s){const o=[],a=[],l=Math.min(t.x,e.x)-.5,c=Math.max(t.x,e.x)+.5,h=Math.min(t.z,e.z)-.5,d=Math.max(t.z,e.z)+.5;this.hash.query(l,h,c,d,_a);for(let u=0;u<_a.length;u++){const f=_a[u];if(f.disabled)continue;const m=f.tag||"solid";if(m==="trigger"||m==="door"||m==="ladder")continue;const _=pl(t,n,f.min,f.max,i+.08);_==null||_>i+.04||o.push({t:_,kind:"world",box:f,tag:m})}for(const u of s)if(!(!u||u.dead||!u.parts))for(const f of u.parts){const m=pl(t,n,f.min,f.max,i+.08);m==null||m>i+.04||a.push({t:m,kind:"target",target:u,part:f.name})}o.sort((u,f)=>u.t-f.t),a.sort((u,f)=>u.t-f.t);for(const u of a){let f=!1;for(const m of o){if(m.t>=u.t-.02)break;if(m.tag!=="thin"){if(m.tag==="glass"){if(!m.box.disabled){const _=t.clone().addScaledVector(n,m.t);bh(m.box,this.effects,_)}continue}if(!(this._isFloorish(m.box)&&Math.abs(n.y)<.4)&&!this._wallOverlapsTarget(m.box,u.target)&&u.t-m.t>.12){f=!0;break}}}if(!f)return u}for(const u of o)if(u.tag!=="thin"){if(u.tag==="glass"){const f=t.clone().addScaledVector(n,u.t);bh(u.box,this.effects,f);continue}if(!(this._isFloorish(u.box)&&Math.abs(n.y)<.35))return u}return null}_isFloorish(t){return t.max.y-t.min.y<.45&&t.max.x-t.min.x>1.2&&t.max.z-t.min.z>1.2}_wallOverlapsTarget(t,e){if(!t||!e)return!1;const n=1.15,i=e.y??0,s=[[e.x,i+.3,e.z],[e.x,i+1.1,e.z],[e.x,i+1.65,e.z]];for(const[c,h,d]of s)if(c>=t.min.x-n&&c<=t.max.x+n&&h>=t.min.y-n&&h<=t.max.y+n&&d>=t.min.z-n&&d<=t.max.z+n)return!0;(t.min.x+t.max.x)*.5,(t.min.z+t.max.z)*.5;const o=Math.max(t.min.x-e.x,0,e.x-t.max.x),a=Math.max(t.min.z-e.z,0,e.z-t.max.z);return Math.hypot(o,a)<1.1&&i+1.2>=t.min.y-.5&&i<=t.max.y+.5}_resolveHit(t,e){var s,o,a,l,c,h,d,u,f,m,_;const n=t.prev.clone().addScaledVector(t.vel.clone().normalize(),e.t),i=t.pathDist;if(e.kind==="target"){let p=t.damage*(((s=t.rar)==null?void 0:s.dmg)??1);p*=jM(e.part,t.def),p*=KM(i,t.def);let g={killed:!1};typeof e.target.applyDamage=="function"?g=e.target.applyDamage(p,e.part):t.targetRange?g=t.targetRange.applyDamage(e.target,p,e.part):e.target.health!=null&&(e.target.health-=p,e.target.health<=0&&(e.target.health=0,e.target.dead=!0,g.killed=!0)),(a=(o=this.effects)==null?void 0:o.showHitmarker)==null||a.call(o,e.part==="head"),(c=(l=this.effects)==null?void 0:l.spawnDamageNumber)==null||c.call(l,n,p,e.part==="head"),(d=(h=this.effects)==null?void 0:h.spawnImpact)==null||d.call(h,n,"target"),(f=(u=this.bus)==null?void 0:u.emit)==null||f.call(u,"combat:hit",{damage:p,part:e.part,dist:i,killed:g.killed})}else(_=(m=this.effects)==null?void 0:m.spawnImpact)==null||_.call(m,n,e.tag||"solid")}}const tr=Math.PI/180;class xo{constructor(t,e,n,i){this.camera=t,this.hash=e,this.bus=n,this.effects=i,this.ballistics=new JM(e,i,n),this.slots=[null,null],this.active=0,this.prevSlot=0,this.ads=0,this.wantAds=!1,this.reloading=!1,this.reloadT=0,this.reloadDur=0,this.swapT=0,this.swapDur=0,this.shotCooldown=0,this.shotIndex=0,this.lastShotAge=999,this.aimOffsetH=0,this.aimOffsetV=0,this.spread=0,this.boltReady=!0,this.ammo={light:60,heavy:90,long:10,shell:16},this.health=Gn.BASE_HEALTH,this.armor=0,this.armorLevel=0,this.overlay=null,this.viewGroup=new $t,this.viewGroup.name="viewWeapon",this._vmRoot=null,this._vmMag=null,this._muzzle=new he,this._kick=0,this._muzzleFlash=null,this._muzzleLight=null,this.weaponModels={},this.giveWeapon("sidearm","common")}attachOverlay(t){this.overlay=t,t.mount.add(this.viewGroup),this._muzzleLight=new Nl(16764040,0,1.2,2),this.viewGroup.add(this._muzzleLight),this._rebuildView()}setWeaponModels(t={}){this.weaponModels=t||{},this._rebuildView()}get current(){return this.slots[this.active]}get def(){const t=this.current;return t?ps[t.weaponId]:null}static makeInstance(t,e="common"){const n=ps[t];if(!n)return null;const i=on[e]||on.common,s=Math.max(1,Math.round(n.magSize*i.mag));return{weaponId:t,rarity:i.id,mag:s,magSize:s,ammoType:n.ammo}}giveWeapon(t,e="common"){const n=xo.makeInstance(t,e);return n?(this.slots[0]?this.slots[1]?this.slots[this.active]=n:(this.slots[1]=n,this.prevSlot=this.active,this.active=1):(this.slots[0]=n,this.active=0),this._rebuildView(),this.reloading=!1,this.shotIndex=0,!0):!1}pickupWeapon(t,e="common"){const n=xo.makeInstance(t,e);if(!n)return{ok:!1,dropped:null};let i=null;return this.slots[0]?this.slots[1]?(i=this.slots[this.active],this.slots[this.active]=n):(this.slots[1]=n,this.prevSlot=this.active,this.active=1):(this.slots[0]=n,this.active=0),this._rebuildView(),this.reloading=!1,this.shotIndex=0,this.swapT=0,{ok:!0,dropped:i}}dropActive(){const t=this.slots[this.active];return this.slots[this.active]=null,!this.slots[0]&&this.slots[1]?this.active=1:!this.slots[1]&&this.slots[0]&&(this.active=0),this._rebuildView(),t}selectSlot(t){var e;t!==0&&t!==1||!this.slots[t]||t===this.active||(this.def,this.prevSlot=this.active,this.active=t,this.swapDur=((e=this.def)==null?void 0:e.swapTime)??.4,this.swapT=this.swapDur,this.reloading=!1,this.shotIndex=0,this._rebuildView())}quickSwap(){const t=this.active===0?1:0;this.slots[t]?this.selectSlot(t):this.slots[this.prevSlot]&&this.prevSlot!==this.active&&this.selectSlot(this.prevSlot)}startReload(){const t=this.current,e=this.def;if(!t||!e||this.reloading||this.swapT>0||t.mag>=t.magSize||(this.ammo[e.ammo]??0)<=0)return;this.reloading=!0,this.reloadDur=t.mag<=0?e.reloadTimeEmpty:e.reloadTime;const i=on[t.rarity]||on.common;this.reloadDur*=i.reload,this.reloadT=this.reloadDur}_finishReload(){const t=this.current,e=this.def;if(!t||!e){this.reloading=!1;return}const n=t.magSize-t.mag,i=this.ammo[e.ammo]??0,s=Math.min(n,i);t.mag+=s,this.ammo[e.ammo]=i-s,this.reloading=!1,this.shotIndex=0}_rebuildView(){var o;const t=[];for(;this.viewGroup.children.length;){const a=this.viewGroup.children[0];if(this.viewGroup.remove(a),a.isLight){t.push(a);continue}(o=a.traverse)==null||o.call(a,l=>{l.geometry&&l.geometry.dispose(),l.material&&(Array.isArray(l.material)?l.material.forEach(c=>c.dispose()):l.material.dispose())})}for(const a of t)this.viewGroup.add(a);this._vmRoot=null,this._vmMag=null,this._muzzleFlash=null;const e=this.def;if(!e)return;const n=kl(e.class),i=this.weaponModels[n]||null,s=qM(e,i);if(this._vmRoot=s.root,this._vmMag=s.mag,this._muzzle=s.muzzle,this.viewGroup.add(s.root),e.class==="sniper"||e.class==="dmr")this._muzzleFlash=null;else{const a=new ht(new Yi(.024,8,8),new ln({color:16771232,transparent:!0,opacity:0,depthTest:!1,depthWrite:!1}));a.position.copy(s.muzzle.position),a.position.x+=.008,a.visible=!1,a.frustumCulled=!1,a.renderOrder=1e3,s.root.add(a),this._muzzleFlash=a}}getAimDir(t,e){const n=this.camera.camera;t.set(0,0,-1).applyQuaternion(n.quaternion);const i=new Dn().setFromAxisAngle(new P(0,1,0),this.aimOffsetH*tr),s=new P(1,0,0).applyQuaternion(n.quaternion),o=new Dn().setFromAxisAngle(s,-this.aimOffsetV*tr);t.applyQuaternion(i).applyQuaternion(o).normalize();const a=this.def;if(!a)return t;const l=this.ads*this.ads*(3-2*this.ads);let c=Fe.lerp(a.spreadHip,a.spreadAds,l);if(c+=(a.spreadMove||0)*(1-l),c+=this.spread*Fe.lerp(1,.35,l),c>.02&&e){const h=c*tr*(.2+e()*.8),d=e()*Math.PI*2,u=new P(0,1,0),f=new P().crossVectors(t,u);f.lengthSq()<1e-6&&f.set(1,0,0),f.normalize();const m=new P().crossVectors(f,t).normalize();t.addScaledVector(f,Math.cos(d)*Math.tan(h)),t.addScaledVector(m,Math.sin(d)*Math.tan(h)),t.normalize()}return t}_fireOne(t,e,n,i,s){var f,m;const o=this.def,a=this.current;if(!o||!a)return;const l=o.muzzleVelocity||600,c=o.class==="sniper"||o.class==="dmr",h=e.clone().normalize();this.ballistics.fire({origin:t.clone(),dir:h,speed:l,damage:o.damage,def:o,rar:s,targetRange:i,maxDist:500});const d=c?32:16,u=t.clone().addScaledVector(h,d);this.effects.spawnTracer(t,u,{long:c,centered:!0}),(m=(f=this.effects).spawnMuzzleBloom)==null||m.call(f,t.clone().addScaledVector(h,.4),c?1.4:.9);{const _=this.camera.camera,p=new P(0,0,-1).applyQuaternion(_.quaternion),g=new P(1,0,0).applyQuaternion(_.quaternion),x=new P(0,1,0).applyQuaternion(_.quaternion),M=t.clone().addScaledVector(g,.14).addScaledVector(x,-.1).addScaledVector(p,.15);this.effects.spawnCasing(M,g,x,p)}}tryFire(t,e,n,i){const s=this.def,o=this.current;if(!s||!o||this.reloading||this.swapT>0||this.shotCooldown>0||s.fireMode==="bolt"&&!this.boltReady)return!1;if(o.mag<=0)return this.startReload(),!1;const l=this.camera.camera.position.clone(),c=on[o.rarity]||on.common,h=s.pellets||1,d=new P;for(let M=0;M<h;M++)this.getAimDir(d,n),this._fireOne(l,d,t,e,c);o.mag--,this.shotCooldown=60/s.rpm,this.lastShotAge=0,this.boltReady=s.fireMode!=="bolt",this._kick=Math.min(1,this._kick+.65),this._muzzleFlash&&(this._muzzleFlash.visible=!0,this._muzzleFlash.material.opacity=.85,this._muzzleFlash.scale.setScalar(.55+Math.random()*.25)),this._muzzleLight&&(this._muzzleLight.intensity=1.8);const u=this.ads*this.ads*(3-2*this.ads),f=Fe.lerp(1,s.adsRecoilMult??.45,u),m=s.recoilPattern,_=this.shotIndex%m.length,[p,g]=m[_];this.aimOffsetH+=p*f,this.aimOffsetV+=g*f,this.camera.recoilPitch+=g*tr*.55*f,this.camera.recoilYaw+=p*tr*.35*f,this.shotIndex++;const x=Fe.lerp(1,s.pellets>1?.85:.28,u);if(x>.05||s.pellets>1){const M=s.spreadPerShot*x*(i&&this.ads<.5?1.25:1);this.spread=Math.min(s.spreadMax,this.spread+M)}return e&&e.stats.shots++,this.bus.emit("combat:shot",{weapon:s.id}),!0}tick(t,e,n,i,s,o){var _,p,g;this.ballistics.update(t,n||[]),this.wantAds=e.buttons.has(2);const a=this.def,l=a?1/Math.max(.08,a.adsTime*(((p=on[(_=this.current)==null?void 0:_.rarity])==null?void 0:p.ads)??1)):4;this.wantAds&&!this.reloading?this.ads=Math.min(1,this.ads+l*t):this.ads=Math.max(0,this.ads-l*1.4*t);const c=this.ads*this.ads*(3-2*this.ads);this._kick=Math.max(0,this._kick-t*7),this._muzzleFlash&&this._muzzleFlash.material.opacity>0&&(this._muzzleFlash.material.opacity=Math.max(0,this._muzzleFlash.material.opacity-t*20),this._muzzleFlash.material.opacity<=.02&&(this._muzzleFlash.visible=!1)),this._muzzleLight&&(this._muzzleLight.intensity=Math.max(0,this._muzzleLight.intensity-t*28));const h=this._kick*.035,d=this._kick*.007;this.viewGroup.position.set(Fe.lerp(.18,0,c)+d,Fe.lerp(-.16,-.005,c)-this._kick*.01,Fe.lerp(-.4,-.3,c)+h),this.viewGroup.rotation.set(Fe.lerp(.05,0,c)-this._kick*.055,Fe.lerp(.2,0,c),Fe.lerp(.04,0,c));const u=!!(a!=null&&a.hideViewOnAds);if(this._vmRoot)if(u){const x=1-Math.max(0,(c-.55)/.45);this._vmRoot.visible=x>.05,this._vmRoot.traverse(M=>{if(M.isMesh&&M.material){const y=Array.isArray(M.material)?M.material:[M.material];for(const A of y)(A.transparent||x<.99)&&(A.transparent=!0,A.opacity=Math.max(.02,x),A.depthWrite=x>.5)}})}else this._vmRoot.visible=!0;if(this._vmRoot&&!this.reloading&&this._vmRoot.visible){const x=performance.now()*.001,M=1-c;this._vmRoot.position.y=Math.sin(x*1.5)*.003*M,this._vmRoot.rotation.z=Math.sin(x*1.05)*.006*M}if(this._vmMag){const x=(g=this._vmMag.userData)==null?void 0:g.magMesh;if(this.reloading){const M=1-this.reloadT/Math.max(1e-4,this.reloadDur);let y=0,A=0;if(M<.35)y=-(M/.35)*.18,A=M/.35*.04;else if(M<.7)y=-.18,A=.04;else{const w=(M-.7)/.3;y=-.18*(1-w),A=.04*(1-w)}x?(x.userData._baseY==null&&(x.userData._baseY=x.position.y),x.position.y=x.userData._baseY+y,x.visible=M<.4||M>.65):(this._vmMag.position.set(A,y,0),this._vmMag.visible=M<.4||M>.65)}else x?(x.userData._baseY!=null&&(x.position.y=x.userData._baseY),x.visible=!0):(this._vmMag.position.set(0,0,0),this._vmMag.visible=!0)}if(this.camera.recoilPitch*=Math.exp(-12*t),this.camera.recoilYaw*=Math.exp(-12*t),Math.abs(this.camera.recoilPitch)<1e-4&&(this.camera.recoilPitch=0),Math.abs(this.camera.recoilYaw)<1e-4&&(this.camera.recoilYaw=0),this.lastShotAge+=t,this.lastShotAge>=Gn.RECOIL_RECOVERY_DELAY){const x=Gn.RECOIL_RECOVERY_RATE*t;this.aimOffsetV>0&&(this.aimOffsetV=Math.max(0,this.aimOffsetV-x)),this.aimOffsetH>0?this.aimOffsetH=Math.max(0,this.aimOffsetH-x):this.aimOffsetH<0&&(this.aimOffsetH=Math.min(0,this.aimOffsetH+x))}if(a){const x=Gn.SPREAD_RECOVER*(1+this.ads*1.6)*t;this.spread=Math.max(0,this.spread-x)}if(this.shotCooldown>0&&(this.shotCooldown-=t),this.swapT>0&&(this.swapT-=t),this.reloading&&(this.reloadT-=t,this.reloadT<=0&&this._finishReload()),(a==null?void 0:a.fireMode)==="bolt"&&!this.boltReady&&this.shotCooldown<=0&&(this.boltReady=!0),!e.locked)return;const f=e.buttons.has(0),m=a==null?void 0:a.fireMode;f&&a&&m==="auto"&&this.tryFire(n,i,s,o)}firePressed(t,e,n,i){const s=this.def;s&&s.fireMode!=="auto"&&this.tryFire(t,e,n,i)}hudState(){var n,i;const t=this.current,e=this.def;return{name:(e==null?void 0:e.name)??"—",rarity:(t==null?void 0:t.rarity)??"common",mag:(t==null?void 0:t.mag)??0,magSize:(t==null?void 0:t.magSize)??0,reserve:e?this.ammo[e.ammo]??0:0,reloading:this.reloading,reloadFrac:this.reloading?1-this.reloadT/Math.max(1e-4,this.reloadDur):0,ads:this.ads,scopeOverlay:!!(e!=null&&e.scopeOverlay),scopeZoomFov:(e==null?void 0:e.scopeZoomFov)??null,weaponClass:(e==null?void 0:e.class)??null,slot:this.active,slot0:this.slots[0]?(n=ps[this.slots[0].weaponId])==null?void 0:n.name:null,slot1:this.slots[1]?(i=ps[this.slots[1].weaponId])==null?void 0:i.name:null,health:this.health,armor:this.armor}}}class QM{constructor(t){this.renderer=t,this.scene=new ld,this.camera=new We(52,1,.01,5),this.camera.position.set(0,0,0);const e=new lr(16774376,2.6);e.position.set(.5,1,.7),this.scene.add(e);const n=new lr(9484520,1);n.position.set(-.7,.3,.5),this.scene.add(n);const i=new lr(16777215,.85);i.position.set(.15,-.2,-1),this.scene.add(i);const s=new A_(10135736,.6);this.scene.add(s);const o=new gd(14216447,3811864,.5);this.scene.add(o),this.root=new $t,this.root.name="weaponOverlayRoot",this.scene.add(this.root),this._aspect=1}setAspect(t){this._aspect=t,this.camera.aspect=t,this.camera.updateProjectionMatrix()}get mount(){return this.root}render(){const t=this.renderer,e=t.autoClear;t.autoClear=!1,t.clearDepth(),t.render(this.scene,this.camera),t.autoClear=e}}function bn(r,t,e,n,i,s,o){return{name:r,min:new P(t-i/2,e-s/2,n-o/2),max:new P(t+i/2,e+s/2,n+o/2),cx:t,cy:e,cz:n,sx:i,sy:s,sz:o}}function tv(r,t,e){const n=t+1.68;return[bn("head",r,n,e,.4,.4,.4),bn("chest",r,t+1.25,e,.58,.6,.5),bn("abdomen",r,t+.85,e,.52,.45,.45),bn("arm",r-.32,t+1.2,e,.28,.65,.35),bn("arm",r+.32,t+1.2,e,.28,.65,.35),bn("leg",r-.14,t+.42,e,.28,.85,.35),bn("leg",r+.14,t+.42,e,.28,.85,.35)]}function Rh(r,t,e){return[bn("head",r,t+1.72,e,.48,.42,.48),bn("chest",r,t+1.28,e,.78,.55,.78),bn("abdomen",r,t+.9,e,.72,.4,.72),bn("leg",r,t+.42,e,.65,.88,.65)]}function ev(r,t=12864058){const e=new $t,n=new _e({color:t,roughness:.75}),i=new _e({color:13934704,roughness:.7});for(const s of r){const o=new ht(new Pt(s.sx,s.sy,s.sz),s.name==="head"?i:n);o.position.set(s.cx,s.cy,s.cz),o.castShadow=!0,e.add(o)}return e}class nv{constructor(t,e){this.scene=t,this.terrain=e,this.targets=[],this.group=new $t,this.group.name="testRange",this.scene.add(this.group),this.active=!1,this.stats={shots:0,hits:0,damage:0,headshots:0}}toggle(t){return this.active?this.clear():this.spawn(t),this.active}clear(){for(this.active=!1;this.group.children.length;)this.group.remove(this.group.children[0]);this.targets.length=0,this.stats={shots:0,hits:0,damage:0,headshots:0}}spawn(t){this.clear(),this.active=!0;const e=[5,10,15,20,30,45,60,80,100,130,160,200],n=t.x,i=t.z;for(let s=0;s<e.length;s++){const o=e[s],a=n+8+s%3*4,l=i-o,c=this.terrain.heightAt(a,l),h=tv(a,c,l),d=ev(h,s%2===0?12864058:3828420);this.group.add(d),this.targets.push({id:s,range:o,x:a,y:c,z:l,parts:h,mesh:d,health:Gn.BASE_HEALTH,armor:0,dead:!1,maxHealth:Gn.BASE_HEALTH})}}applyDamage(t,e,n){if(t.dead)return{killed:!1,applied:0};let i=e;if(t.armor>0){const s=Math.min(t.armor,i);t.armor-=s,i-=s}return t.health-=i,this.stats.hits++,this.stats.damage+=e,n==="head"&&this.stats.headshots++,t.health<=0?(t.health=0,t.dead=!0,t.mesh.traverse(s=>{s.isMesh&&(s.material=s.material.clone(),s.material.color.setHex(3355443))}),{killed:!0,applied:e}):{killed:!1,applied:e}}getLiveTargets(){return this.targets}}const cs=[],to=new P;function me(r,t){let e=r*374761393+t*668265263|0;return e=(e^e>>>13)*1274126177,((e^e>>>16)>>>0)/4294967296}class iv{constructor(t,e,n,i){this.scene=t,this.terrain=e,this.hash=n,this.bus=i,this.group=new $t,this.group.name="bots",this.scene.add(this.group),this.bots=[],this._live=[]}spawn(t=de.COUNT){this.clear();const e=Kt.SPAWN.x,n=Kt.SPAWN.z;let i=0,s=0;for(;i<t&&s<t*40;){s++;const o=me(s,11)*Math.PI*2,a=de.SPAWN_MIN+me(s,29)*(de.SPAWN_MAX-de.SPAWN_MIN),l=e+Math.cos(o)*a,c=n+Math.sin(o)*a;this._isWalkable(l,c)&&(this._addBot(i,l,c),i++)}for(;i<t;){const o=i/t*Math.PI*2,a=e+Math.cos(o)*40,l=n+Math.sin(o)*40;this._addBot(i,a,l),i++}return this.bots.length}clear(){for(;this.group.children.length;)this.group.remove(this.group.children[0]);this.bots.length=0}_addBot(t,e,n){const i=this.terrain.heightAt(e,n),s=de.COLORS[t%de.COLORS.length],o=this._buildLocalMesh(s);o.position.set(e,i,n),this.group.add(o);const a=me(t,19)<de.AGGRESSIVE_FRACTION,l={id:t,x:e,y:i,z:n,yaw:me(t,7)*Math.PI*2,speed:de.SPEED+(me(t,3)-.5)*2*de.SPEED_JITTER,vx:0,vz:0,health:de.HEALTH,maxHealth:de.HEALTH,armor:0,dead:!1,respawnT:0,waypoint:{x:e,z:n},pauseT:.2+me(t,5)*de.WAYPOINT_PAUSE,homeX:e,homeZ:n,parts:Rh(e,i,n),mesh:o,color:s,applyDamage:null,aggressive:a,state:"wander",aggroT:0,fireCd:me(t,23)*.4,aimYaw:0};return l.applyDamage=(c,h)=>this.applyDamage(l,c,h),this._pickWaypoint(l,t*17+1),this.bots.push(l),l}_buildLocalMesh(t){const e=new $t,n=new _e({color:t,roughness:.78,metalness:.08}),i=new _e({color:1711136,roughness:.65,metalness:.2}),s=new _e({color:13213818,roughness:.82,metalness:.02}),o=new _e({color:2435120,roughness:.55,metalness:.25}),a=new _e({color:1315862,roughness:.7,metalness:.1}),l=(E,L=e)=>(E.castShadow=!0,E.receiveShadow=!0,L.add(E),E);l(new ht(new Pt(.14,.1,.24),a)).position.set(-.11,.05,.02),l(new ht(new Pt(.14,.1,.24),a)).position.set(.11,.05,.02);const c=E=>{const L=new $t;L.position.set(E,.95,0);const U=new ht(new un(.07,.08,.42,8),i);U.position.y=-.21,U.castShadow=!0,L.add(U);const v=new ht(new un(.055,.065,.4,8),i);v.position.y=-.62,v.castShadow=!0,L.add(v);const S=new ht(new Pt(.1,.08,.1),o);return S.position.y=-.42,L.add(S),e.add(L),L},h=c(-.12),d=c(.12);l(new ht(new Pt(.38,.14,.22),i)).position.set(0,.98,0),l(new ht(new Pt(.4,.48,.22),n)).position.set(0,1.28,0),l(new ht(new Pt(.42,.36,.26),o)).position.set(0,1.32,.01);for(const E of[-.1,.1])l(new ht(new Pt(.1,.12,.08),i)).position.set(E,1.22,.16);l(new ht(new Pt(.08,.1,.06),i)).position.set(.18,1.38,.14);const f=(E,L)=>{const U=new $t;U.position.set(E,1.48,0);const v=new ht(new un(.055,.06,.32,8),n);v.position.y=-.16,v.castShadow=!0,U.add(v);const S=new ht(new un(.045,.05,.3,8),n);S.position.y=-.45,S.castShadow=!0,U.add(S);const I=new ht(new Pt(.07,.1,.08),i);return I.position.y=-.62,U.add(I),U.rotation.z=L*.08,U.rotation.x=.12,e.add(U),U},m=f(-.28,-1),_=f(.28,1);l(new ht(new un(.06,.07,.1,8),s)).position.set(0,1.58,0);const p=l(new ht(new Yi(.13,12,10),s));p.position.set(0,1.72,0),p.scale.set(1,1.05,.95),l(new ht(new Yi(.145,12,8,0,Math.PI*2,0,Math.PI*.55),i)).position.set(0,1.78,0),l(new ht(new Pt(.06,.04,.08),o)).position.set(0,1.88,.08),l(new ht(new Pt(.16,.04,.06),o)).position.set(0,1.76,.12),l(new ht(new Pt(.28,.35,.14),i)).position.set(0,1.3,-.18);const M=new $t;M.position.set(.12,1.15,.28),M.rotation.set(-.15,.35,.1);const y=new ht(new Pt(.06,.08,.32),i);M.add(y);const A=new ht(new un(.015,.015,.28,6),o);A.rotation.x=Math.PI/2,A.position.z=.28,M.add(A),e.add(M);const w=new ht(new Pt(.16,.05,.05),new ln({color:16724787}));return w.position.set(0,2.05,0),e.add(w),e.userData.lLeg=h,e.userData.rLeg=d,e.userData.lArm=m,e.userData.rArm=_,e.userData.gun=M,e}_isWalkable(t,e){if(Math.abs(t)>dt.SIZE*.45||Math.abs(e)>dt.SIZE*.45)return!1;const n=this.terrain.heightAt(t,e);return!(n<dt.WATER_LEVEL+.4||this.terrain.slopeDegAt&&this.terrain.slopeDegAt(t,e)>28||this._blocked(t,n,e))}_blocked(t,e,n){const i=de.RADIUS,s=de.HEIGHT;this.hash.query(t-i-.2,n-i-.2,t+i+.2,n+i+.2,cs);for(let o=0;o<cs.length;o++){const a=cs[o];if(a.disabled||a.tag==="trigger"||a.tag==="door"||a.tag==="thin"||a.tag==="glass"||e+s<a.min.y||e+.3>a.max.y)continue;const l=Math.max(a.min.x,Math.min(t,a.max.x)),c=Math.max(a.min.z,Math.min(n,a.max.z)),h=t-l,d=n-c;if(h*h+d*d<i*i)return!0}return!1}_pickWaypoint(t,e=0){const n=Ps;if(n!=null&&n.length&&me(t.id+e,77)<de.BUILDING_WAYPOINT_CHANCE){const i=n[Math.floor(me(t.id+e,79)*n.length)%n.length];if(i&&i.w>5&&i.d>5){const s=me(t.id+e,81)>.45;let o,a;if(s?(o=i.x+i.w*(.25+me(t.id+e,83)*.5),a=i.z+i.d*(.25+me(t.id+e,85)*.5)):(o=i.x+i.w*.5+(me(t.id+e,87)-.5)*i.w*.3,a=i.z-1.5-me(t.id+e,89)*3),this._isWalkable(o,a)){t.waypoint.x=o,t.waypoint.z=a;return}}}for(let i=0;i<14;i++){const s=me(t.id+e+i,41)*Math.PI*2,o=5+me(t.id+e+i,43)*de.WANDER_RADIUS,a=t.homeX+Math.cos(s)*o*(.35+me(t.id+i,47)*.65),l=t.homeZ+Math.sin(s)*o*(.35+me(t.id+i,53)*.65);if(this._isWalkable(a,l)){t.waypoint.x=a,t.waypoint.z=l;return}}t.waypoint.x=t.homeX+(me(t.id+e,59)-.5)*10,t.waypoint.z=t.homeZ+(me(t.id+e,61)-.5)*10}_hasLOS(t,e,n,i,s,o){to.set(i-t,s-e,o-n);const a=to.length();if(a<.5)return!0;to.multiplyScalar(1/a);const l=Math.min(t,i)-.5,c=Math.max(t,i)+.5,h=Math.min(n,o)-.5,d=Math.max(n,o)+.5;this.hash.query(l,h,c,d,cs);const u=new P(t,e,n);for(let f=0;f<cs.length;f++){const m=cs[f];if(m.disabled)continue;const _=m.tag||"solid";if(_==="trigger"||_==="door"||_==="ladder"||_==="glass"||_==="thin"||_==="elevator"||m.max.y-m.min.y<.4&&m.max.x-m.min.x>1.5)continue;const p=pl(u,to,m.min,m.max,a-.4);if(p!=null&&p>.3&&p<a-.5)return!1}return!0}_syncParts(t){t.parts=Rh(t.x,t.y,t.z)}applyDamage(t,e,n){if(t.dead)return{killed:!1,applied:0};let i=e;if(t.armor>0){const s=Math.min(t.armor,i);t.armor-=s,i-=s}return t.health-=i,t.health<=0?(t.health=0,t.dead=!0,t.respawnT=de.RESPAWN_TIME,t.mesh.visible=!1,this.bus.emit("bot:killed",{id:t.id,part:n}),{killed:!0,applied:e}):(t.mesh.traverse(s=>{s.isMesh&&s.material&&s.material.emissive&&(s.material.emissive.setHex(4456448),s.material.emissiveIntensity=.6)}),t._flinchT=.12,{killed:!1,applied:e})}update(t,e=null,n=null){for(const i of this.bots){if(i.dead){i.respawnT-=t,i.respawnT<=0&&this._respawn(i);continue}if(i._flinchT>0&&(i._flinchT-=t,i._flinchT<=0&&i.mesh.traverse(m=>{m.isMesh&&m.material&&m.material.emissive&&(m.material.emissive.setHex(0),m.material.emissiveIntensity=0)})),i.aggressive&&e&&n&&n.health>0){const m=e.x-i.x,_=e.z-i.z,p=Math.hypot(m,_),g=i.y+1.55,x=e.y+1.5;if(i.state==="wander"&&p<de.AGGRO_RANGE)this._hasLOS(i.x,g,i.z,e.x,x,e.z)?(i.aggroT+=t,i.aggroT>=de.REACTION_TIME&&(i.state="engage",i.pauseT=0)):i.aggroT=Math.max(0,i.aggroT-t*.5);else if(i.state==="engage")if(p>de.LOSE_RANGE)i.state="wander",i.aggroT=0,this._pickWaypoint(i,performance.now()*.01|0);else{if(i.yaw=Math.atan2(m,_),i.mesh.rotation.y=i.yaw,i.vx=0,i.vz=0,p>18&&p<de.FIRE_RANGE){const w=m/p,E=_/p,L=i.speed*.55*t,U=i.x+w*L,v=i.z+E*L;this._isWalkable(U,v)&&!this._blocked(U,this.terrain.heightAt(U,v),v)&&(i.x=U,i.z=v,i.y=this.terrain.heightAt(i.x,i.z))}i.fireCd-=t,i.fireCd<=0&&p<de.FIRE_RANGE&&this._hasLOS(i.x,g,i.z,e.x,x,e.z)&&(this._botShoot(i,e,n,p),i.fireCd=de.FIRE_COOLDOWN*(.85+me(i.id,performance.now()*.01|0)*.4)),i.mesh.position.set(i.x,i.y,i.z),this._idleAnim(i,t);const{lArm:M,rArm:y,gun:A}=i.mesh.userData;M&&(M.rotation.x=-.9,M.rotation.z=-.15),y&&(y.rotation.x=-.95,y.rotation.z=.2),A&&A.rotation.set(-.05,.1,.05),this._syncParts(i);continue}}if(i.pauseT>0){i.pauseT-=t,i.vx=0,i.vz=0,this._idleAnim(i,t),this._syncParts(i);continue}const s=i.waypoint.x-i.x,o=i.waypoint.z-i.z,a=Math.hypot(s,o);if(a<de.WAYPOINT_REACH){i.pauseT=de.WAYPOINT_PAUSE+me(i.id,performance.now()*.001|0)*1.2,this._pickWaypoint(i,performance.now()*.01|0),this._syncParts(i);continue}const l=s/a,c=o/a,h=i.speed*t;let d=i.x+l*h,u=i.z+c*h;const f=this.terrain.heightAt(d,u);if(!this._isWalkable(d,u)||this._blocked(d,f,u)){const m=this._isWalkable(i.x+l*h,i.z)&&!this._blocked(i.x+l*h,this.terrain.heightAt(i.x+l*h,i.z),i.z),_=this._isWalkable(i.x,i.z+c*h)&&!this._blocked(i.x,this.terrain.heightAt(i.x,i.z+c*h),i.z+c*h);if(m)d=i.x+l*h,u=i.z;else if(_)d=i.x,u=i.z+c*h;else{this._pickWaypoint(i,performance.now()*.02+i.id|0),this._syncParts(i);continue}}i.vx=l*i.speed,i.vz=c*i.speed,i.x=d,i.z=u,i.y=this.terrain.heightAt(i.x,i.z),i.yaw=Math.atan2(l,c),i.mesh.position.set(i.x,i.y,i.z),i.mesh.rotation.y=i.yaw,this._walkAnim(i,t,a),this._syncParts(i)}}_botShoot(t,e,n,i){var h,d,u;const s=de.FIRE_SPREAD_DEG*(1+i/40);if(Math.abs(me(t.id,performance.now()*.1|0)-.5)*2*s>2.2)return;let a=de.FIRE_DAMAGE;i>30&&(a*=Math.max(.45,1-(i-30)/50));let l=a;if(n.armor>0){const f=Math.min(n.armor,l);n.armor-=f,l-=f}n.health=Math.max(0,n.health-l),(d=(h=this.bus)==null?void 0:h.emit)==null||d.call(h,"bot:shot",{id:t.id,dmg:a,dist:i});const c=(u=t.mesh.userData)==null?void 0:u.gun;c&&(c.traverse(f=>{var m;f.isMesh&&((m=f.material)!=null&&m.emissive)&&(f.material.emissive.setHex(16755264),f.material.emissiveIntensity=1.2)}),t._muzzleT=.06)}_walkAnim(t,e,n){const s=performance.now()*.001*t.speed*2.4+t.id*.7,o=Math.sin(s)*.55,{lLeg:a,rLeg:l,lArm:c,rArm:h}=t.mesh.userData;a&&(a.rotation.x=o),l&&(l.rotation.x=-o),c&&(c.rotation.x=.12-o*.55,c.rotation.z=-.08),h&&(h.rotation.x=.12+o*.55,h.rotation.z=.08),t.mesh.position.y=t.y+Math.abs(Math.sin(s))*.025,t.mesh.rotation.y=t.yaw+Math.sin(s*.5)*.03}_idleAnim(t,e){const{lLeg:n,rLeg:i,lArm:s,rArm:o}=t.mesh.userData,a=Math.exp(-8*e);n&&(n.rotation.x*=a),i&&(i.rotation.x*=a),s&&(s.rotation.x=Fe.lerp(s.rotation.x,.15,1-a),s.rotation.z=Fe.lerp(s.rotation.z,-.08,1-a)),o&&(o.rotation.x=Fe.lerp(o.rotation.x,.15,1-a),o.rotation.z=Fe.lerp(o.rotation.z,.08,1-a)),t.mesh.position.set(t.x,t.y,t.z),t.mesh.rotation.y=t.yaw;const l=performance.now()*.001;t.mesh.position.y=t.y+Math.sin(l*1.8+t.id)*.008}_respawn(t){for(let e=0;e<16;e++){const n=me(t.id+e,71)*Math.PI*2,i=5+me(t.id+e,73)*25,s=t.homeX+Math.cos(n)*i,o=t.homeZ+Math.sin(n)*i;if(this._isWalkable(s,o)){t.x=s,t.z=o,t.y=this.terrain.heightAt(s,o),t.health=t.maxHealth,t.dead=!1,t.respawnT=0,t.mesh.visible=!0,t.mesh.position.set(t.x,t.y,t.z),this._pickWaypoint(t,e+99),this._syncParts(t),t.mesh.traverse(a=>{a.isMesh&&a.material&&a.material.emissive&&(a.material.emissive.setHex(0),a.material.emissiveIntensity=0)});return}}t.x=t.homeX,t.z=t.homeZ,t.y=this.terrain.heightAt(t.x,t.z),t.health=t.maxHealth,t.dead=!1,t.mesh.visible=!0,t.mesh.position.set(t.x,t.y,t.z),this._syncParts(t)}getLiveTargets(){this._live.length=0;for(const t of this.bots)t.dead||this._live.push(t);return this._live}}function Bn(r,t){let e=0;for(const i of Object.values(t))e+=i;let n=r()*e;for(const[i,s]of Object.entries(t))if(n-=s,n<=0)return i;return Object.keys(t)[0]}function xa(r){return Bn(r,Object.fromEntries(Object.values(on).map(t=>[t.id,t.weight])))}function Le(r,t={}){return new _e({color:r,roughness:t.rough??.55,metalness:t.metal??.25,emissive:new Lt(r).multiplyScalar(t.em??0),emissiveIntensity:1})}class sv{constructor(t,e,n){this.scene=t,this.terrain=e,this.bus=n,this.group=new $t,this.group.name="loot",t.add(this.group),this.items=[],this.cases=[],this._id=0,this.weaponModels={}}setWeaponModels(t={}){this.weaponModels=t||{}}clear(){for(;this.group.children.length;){const t=this.group.children[0];this.group.remove(t),t.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(n=>n.dispose()):e.material.dispose())})}this.items.length=0,this.cases.length=0}_meshFor(t){var n,i;const e=new $t;if(t.kind==="weapon"){const s=ps[t.weaponId],o=on[t.rarity]||on.common,a=kl((s==null?void 0:s.class)||"ar"),l=this.weaponModels[a];if(l){const h=l.clone(!0);h.scale.setScalar(.55),h.rotation.x=-.15,h.rotation.y=Math.PI*.15,h.position.y=.06,h.traverse(d=>{d.isMesh&&(d.castShadow=!0,d.frustumCulled=!0)}),e.add(h)}else{const h=(s==null?void 0:s.color)??5592405,d=new ht(new Pt(.08,.08,((n=s==null?void 0:s.viewModel)==null?void 0:n.len)??.45),Le(h,{metal:.4,rough:.45}));d.position.y=.08,d.castShadow=!0,e.add(d);const u=new ht(new un(.015,.015,.2,8),Le(10066602,{metal:.8,rough:.3}));u.rotation.x=Math.PI/2,u.position.set(0,.08,-(((i=s==null?void 0:s.viewModel)==null?void 0:i.len)??.45)*.45),e.add(u)}const c=new ht(new Pt(.18,.025,.025),Le(o.color,{em:.35,metal:.1,rough:.4}));c.position.set(0,.2,0),e.add(c)}else if(t.kind==="ammo"){const s={light:13152336,heavy:6982218,long:4876954,shell:10115642}[t.ammoType]||12886064,o=new ht(new Pt(.22,.14,.16),Le(s,{rough:.6}));o.position.y=.08,o.castShadow=!0,e.add(o);const a=new ht(new Pt(.2,.02,.14),Le(2763306,{metal:.5}));a.position.y=.16,e.add(a)}else if(t.kind==="armor"){const s=new ht(new Pt(.28,.08,.22),Le(3824250,{metal:.55,rough:.4}));s.position.y=.06,s.castShadow=!0,e.add(s);const o=new ht(new Pt(.24,.04,.18),Le(1710622));o.position.y=.12,e.add(o)}else if(t.kind==="heal"){const s=t.healType==="medkit"?14737640:t.healType==="stim"?4245664:15790320,o=new ht(new Pt(.16,.1,.16),Le(s,{rough:.5}));o.position.y=.07,e.add(o);const a=new ht(new Pt(.1,.02,.03),Le(13377568,{em:.2}));a.position.y=.13,e.add(a);const l=new ht(new Pt(.03,.02,.1),Le(13377568,{em:.2}));l.position.y=.13,e.add(l)}else{const s=new ht(new Pt(.18,.12,.18),Le(11579568));s.position.y=.08,e.add(s)}return e}_buildCaseMesh(){const t=new $t,e=Le(4869946,{rough:.72,metal:.08}),n=Le(3487788,{rough:.75,metal:.06}),i=Le(1842206,{rough:.45,metal:.55}),s=Le(9080468,{rough:.35,metal:.7}),o=Le(2764344,{rough:.95,metal:0}),a=Le(1710620,{rough:.8,metal:.05}),l=1.28,c=.78,h=.38,d=c*.5,u=new ht(new Pt(l,h,c),e);u.position.y=h*.5,u.castShadow=!0,u.receiveShadow=!0,t.add(u);const f=new ht(new Pt(l*.96,.04,c*.96),n);f.position.y=.02,t.add(f);const m=new $t;m.name="lidPivot",m.position.set(0,h,-d);const _=.11,p=new $t;p.position.set(0,_*.5,d);const g=new ht(new Pt(l*.98,_,c*.98),e);g.castShadow=!0,p.add(g);for(let L=-2;L<=2;L++){const U=new ht(new Pt(l*.9,.025,.07),n);U.position.set(0,_*.5+.01,L*.12),p.add(U)}const x=new ht(new Pt(l*.88,.035,c*.88),o);x.position.set(0,-_*.35,0),p.add(x),m.add(p),t.add(m);const M=new ht(new Pt(l*.9,.06,c*.88),o);M.position.set(0,h-.05,.02),t.add(M);for(const L of[-.28,.28]){const U=new ht(new Pt(.42,.04,.5),a);U.position.set(L,h-.02,.02),t.add(U)}for(const L of[-.38,0,.38]){const U=new ht(new Pt(.14,.08,.04),s);U.position.set(L,h-.02,d+.01),t.add(U);const v=new ht(new Pt(.1,.05,.05),i);v.position.set(L,h+.02,d+.03),t.add(v)}const y=new ht(new Pt(.22,.06,.05),i);y.position.set(0,h*.45,d+.04),t.add(y);const A=new ht(new Il(.1,.016,6,16,Math.PI),i);A.rotation.x=Math.PI/2,A.position.set(0,h*.45,d+.09),t.add(A);for(const L of[-1,1])for(const U of[-1,1]){const v=new ht(new Pt(.09,.1,.09),n);v.position.set(L*(l*.5-.04),.1,U*(d-.04)),t.add(v)}const w=new ht(new un(.025,.025,.03,10),i);w.rotation.z=Math.PI/2,w.position.set(l*.45,h*.55,d*.2),t.add(w);const E=new ht(new Pt(.28,.02,.08),Le(13148208,{em:.2,rough:.5,metal:.1}));return E.position.set(-.35,h+_+.02,.05),E.name="caseStripe",t.add(E),t.userData.lidPivot=m,t.userData.stripe=E,t.userData.openDir=new P(0,0,1),t}spawnItem(t,e,n,i){const s=this._meshFor(t);s.position.set(e,n,i),this.group.add(s);const o={id:++this._id,...t,x:e,y:n,z:i,mesh:s,bob:!0};return this.items.push(o),o}spawnItemAtGround(t,e,n){const i=this.terrain.heightAt(e,n);return i<2?null:this.spawnItem(t,e,i,n)}spawnWeaponDrop(t,e,n){return t?this.spawnItemAtGround({kind:"weapon",weaponId:t.weaponId,rarity:t.rarity,mag:t.mag},e,n):null}_rollItem(t){var n;const e=Bn(t,vn.CLASS_WEIGHTS);if(e==="weapon")return{kind:"weapon",weaponId:Bn(t,vn.WEAPON_SPAWN_WEIGHTS),rarity:xa(t)};if(e==="ammo"){const i=Bn(t,{light:30,heavy:35,long:14,shell:15});return{kind:"ammo",ammoType:i,amount:((n=vn.AMMO_PICKUPS[i])==null?void 0:n.amount)??20}}return e==="armor"?{kind:"armor",level:t()>.7?t()>.5?3:2:1,plates:1}:e==="heal"?{kind:"heal",healType:Bn(t,{bandage:50,medkit:30,stim:20})}:{kind:"ammo",ammoType:"heavy",amount:24}}_spawnCase(t,e,n,i,s){const o=this._buildCaseMesh();o.position.set(t,e,n),o.rotation.y=i,this.group.add(o);const a=ei.MIN_ITEMS+Math.floor(s()*(ei.MAX_ITEMS-ei.MIN_ITEMS+1)),l=[];for(let c=0;c<a;c++)l.push(this._rollItem(s));!l.some(c=>c.kind==="weapon")&&s()>.35&&(l[0]={kind:"weapon",weaponId:Bn(s,vn.WEAPON_SPAWN_WEIGHTS),rarity:xa(s)}),this.cases.push({id:++this._id,x:t,y:e,z:n,yaw:i,mesh:o,open:!1,openT:0,contents:l})}populate(t=42){this.clear();const e=_r(t^4103);for(const a of pn){const l=vn.OUTDOOR_PER_POI+(a.id==="downtown"?vn.OUTDOOR_DOWNTOWN_EXTRA:0);for(let c=0;c<l;c++){if(e()>vn.OUTDOOR_SPAWN_CHANCE)continue;const h=e()*Math.PI*2,d=20+e()*70,u=a.x+Math.cos(h)*d,f=a.z+Math.sin(h)*d;this._rollAndSpawnOutdoor(e,u,f)}}const n=dt.SIZE/2-100;for(let a=0;a<vn.OUTDOOR_SCATTER;a++){if(e()>vn.OUTDOOR_SPAWN_CHANCE)continue;const l=(e()*2-1)*n,c=(e()*2-1)*n;this.terrain.heightAt(l,c)<3||this._rollAndSpawnOutdoor(e,l,c)}let i=0;const s=[],o=ei.MIN_SEPARATION;for(const a of Ps){if(a.w<6||a.d<6)continue;let l=0;const c=ei.MAX_PER_BUILDING,h=a.floors,d=new Set([0]);h>1&&d.add(Math.floor(h*.4)),h>3&&d.add(Math.floor(h*.7)),h>2&&d.add(h-1);for(let u=0;u<h;u++)e()<ei.PER_FLOOR_CHANCE*.5&&d.add(u);for(const u of[...d]){if(l>=c)break;const f=u===0&&ei.GUARANTEE_GROUND;if(!f&&e()>ei.PER_FLOOR_CHANCE)continue;const m=Math.min(ei.MAX_PER_FLOOR,1);for(let _=0;_<m&&!(l>=c);_++){const p=this._pickWallCaseSpot(a,u,e,s,o);p&&(this._spawnCase(p.x,p.y,p.z,p.yaw,e),s.push({x:p.x,z:p.z}),i++,l++)}}}return console.info(`[loot] outdoor items ${this.items.length} · supply cases ${i} · buildings ${Ps.length}`),{items:this.items.length,cases:i}}_pickWallCaseSpot(t,e,n,i,s){var h;const a=((h=t.floorYs)==null?void 0:h[e])??t.baseY+.15+e*3.4,l=d=>{const u=Math.max(2,Math.floor(d/2.8)),f=[];for(let m=0;m<u;m++)f.push((m+.5)/u);return f},c=[];for(const d of l(t.w))Math.abs(d-.5)<.22||c.push({lx:t.w*d,lz:.72,yaw:0});for(const d of l(t.w))c.push({lx:t.w*d,lz:t.d-.72,yaw:Math.PI});for(const d of l(t.d))d<.15||c.push({lx:.72,lz:t.d*d,yaw:Math.PI/2});for(const d of l(t.d))d>.55||c.push({lx:t.w-.72,lz:t.d*d,yaw:-Math.PI/2});for(let d=c.length-1;d>0;d--){const u=Math.floor(n()*(d+1)),f=c[d];c[d]=c[u],c[u]=f}for(const d of c){if(d.lx>t.w*.65&&d.lz>t.d*.65)continue;const u=t.x+d.lx,f=t.z+d.lz;let m=!0;for(const _ of i)if(Math.hypot(_.x-u,_.z-f)<s){m=!1;break}if(m)return{x:u,y:a,z:f,yaw:d.yaw}}return null}_rollAndSpawnOutdoor(t,e,n){var a;const s=Bn(t,{weapon:12,ammo:50,armor:12,heal:26});let o;if(s==="weapon")o={kind:"weapon",weaponId:Bn(t,vn.WEAPON_SPAWN_WEIGHTS),rarity:xa(t)};else if(s==="ammo"){const l=Bn(t,{light:30,heavy:35,long:10,shell:15});o={kind:"ammo",ammoType:l,amount:((a=vn.AMMO_PICKUPS[l])==null?void 0:a.amount)??20}}else s==="armor"?o={kind:"armor",level:1,plates:1}:o={kind:"heal",healType:Bn(t,{bandage:60,medkit:20,stim:20})};this.spawnItemAtGround(o,e,n)}nearest(t,e,n,i=2.8){let s=null,o=i;for(const a of this.items){const l=Math.hypot(a.x-t,a.z-n),c=Math.abs((a.y??0)-(e??a.y??0));l<o&&c<2.5&&(o=l,s={type:"item",ref:a})}for(const a of this.cases){if(a.open&&a.openT>=1)continue;const l=Math.hypot(a.x-t,a.z-n),c=Math.abs(a.y-(e??a.y));l<o&&c<2.2&&(o=l,s={type:"case",ref:a})}return s}nearestItem(t,e,n=2.8){let i=null,s=n;for(const o of this.items){const a=Math.hypot(o.x-t,o.z-e);a<s&&(s=a,i=o)}return i}tryPickup(t,e,n,i){var a;const s=this.nearest(e,n,i);if(!s)return!1;if(s.type==="case")return this._tryOpenCase(s.ref,e,i);const o=s.ref;if(o.kind==="weapon"){const{ok:l,dropped:c}=t.pickupWeapon(o.weaponId,o.rarity);return l?(this._remove(o),c&&this.spawnWeaponDrop(c,e+.6,i+.4),this.bus.emit("loot:pickup",{kind:"weapon",id:o.weaponId}),!0):!1}if(o.kind==="ammo"){const l=((a=B_[o.ammoType])==null?void 0:a.stack)??100,c=t.ammo[o.ammoType]??0,h=Math.max(0,l-c);if(h<=0)return!1;const d=Math.min(h,o.amount);return t.ammo[o.ammoType]=c+d,o.amount-=d,o.amount<=0&&this._remove(o),this.bus.emit("loot:pickup",{kind:"ammo",type:o.ammoType,amount:d}),!0}return o.kind==="armor"?(o.level>t.armorLevel?(t.armorLevel=o.level,t.armor=Math.max(t.armor,o.level*50)):t.armor=Math.min((t.armorLevel||1)*50||50,t.armor+50),this._remove(o),!0):o.kind==="heal"?(o.healType==="bandage"?t.health=Math.min(75,t.health+25):o.healType==="medkit"?t.health=100:t.health=Math.min(100,t.health+20),this._remove(o),!0):!1}_tryOpenCase(t){if(t.open)return!1;t.open=!0,t.openT=0,t.mesh.userData.stripe&&(t.mesh.userData.stripe.visible=!1),t.mesh.updateMatrixWorld(!0);const e=new P(0,0,1).applyQuaternion(t.mesh.quaternion),n=new P(1,0,0).applyQuaternion(t.mesh.quaternion);return t.contents.forEach((i,s)=>{const o=t.contents.length,a=(s-(o-1)*.5)*.42,l=.85+s%2*.12,c=t.x+n.x*a+e.x*l,h=t.z+n.z*a+e.z*l;this.spawnItem(i,c,t.y+.06,h)}),t.contents=[],this.bus.emit("loot:case",{id:t.id}),!0}_remove(t){const e=this.items.indexOf(t);e>=0&&this.items.splice(e,1),t.mesh&&(this.group.remove(t.mesh),t.mesh.traverse(n=>{n.geometry&&n.geometry.dispose(),n.material&&(Array.isArray(n.material)?n.material.forEach(i=>i.dispose()):n.material.dispose())}))}prompt(t,e,n){var o,a;const i=this.nearest(t,e??0,n);if(!i)return null;if(i.type==="case")return i.ref.open?null:"E · Open supply case";const s=i.ref;if(s.kind==="weapon"){const l=((o=ps[s.weaponId])==null?void 0:o.name)??s.weaponId;return`E · Pick up ${((a=on[s.rarity])==null?void 0:a.label)??""} ${l}`}return s.kind==="ammo"?`E · Pick up ${s.ammoType} ammo (${s.amount})`:s.kind==="armor"?`E · Pick up Armor Lv${s.level}`:s.kind==="heal"?`E · Pick up ${s.healType}`:"E · Pick up"}update(t){const e=performance.now()*.002;for(const n of this.items)!n.mesh||n.bob===!1||(n.mesh.position.y=n.y+.04+Math.sin(e+n.id)*.03,n.mesh.rotation.y+=t*.7);for(const n of this.cases){if(!n.open)continue;n.openT=Math.min(1,n.openT+t*2.2);const i=n.mesh.userData.lidPivot;if(i){const s=n.openT*n.openT*(3-2*n.openT);i.rotation.x=-s*1.75}}}}class rv{constructor(){this.root=document.createElement("div"),this.root.id="combat-hud",this.root.style.cssText=["position:fixed","left:0","right:0","bottom:0","top:0","z-index:14","pointer-events:none","font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace","color:#e8ecf0"].join(";"),this.root.innerHTML=`
      <style>
        #combat-hud .panel {
          background: linear-gradient(180deg, rgba(10,14,20,0.55), rgba(8,12,16,0.82));
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
        }
        #ch-ammo-big.empty { color: #ff5a4a; animation: chPulse 0.7s ease-in-out infinite; }
        #ch-ammo-big.low { color: #ffb040; }
        @keyframes chPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.04); }
        }
        #ch-reload-overlay {
          position: absolute; left: 50%; bottom: 22%; transform: translateX(-50%);
          min-width: 220px; padding: 12px 18px; text-align: center;
          display: none;
        }
        #ch-reload-bar-bg {
          height: 10px; margin-top: 8px; border-radius: 5px;
          background: rgba(0,0,0,0.5); border: 1px solid rgba(127,212,255,0.35);
          overflow: hidden;
        }
        #ch-reload-bar {
          height: 100%; width: 0%;
          background: linear-gradient(90deg, #3a9fd4, #7fd4ff);
          box-shadow: 0 0 12px rgba(127,212,255,0.6);
        }
        #ch-bullets {
          display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 3px;
          max-width: 220px; margin-left: auto; margin-top: 8px;
        }
        #ch-bullets i {
          display: block; width: 5px; height: 14px; border-radius: 1px;
          background: #d8e0e8; box-shadow: 0 0 4px rgba(200,220,255,0.35);
        }
        #ch-bullets i.off { background: rgba(255,255,255,0.12); box-shadow: none; }
        #ch-bullets i.low { background: #ffb040; }
        #ch-bullets i.empty { background: #ff4a3a; }
      </style>

      <!-- Vitals -->
      <div class="panel" style="position:absolute;left:16px;bottom:16px;padding:12px 14px;min-width:200px">
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65;margin-bottom:5px">HEALTH</div>
        <div style="height:12px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-hp" style="height:100%;width:100%;background:linear-gradient(90deg,#2f7a3a,#6dce5a)"></div>
        </div>
        <div style="font-size:10px;letter-spacing:0.14em;opacity:0.65;margin:10px 0 5px">ARMOR</div>
        <div style="height:9px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div id="ch-ar" style="height:100%;width:0%;background:linear-gradient(90deg,#2a5a8a,#6aafd0)"></div>
        </div>
      </div>

      <!-- Weapon panel -->
      <div class="panel" id="ch-weapon" style="position:absolute;right:16px;bottom:16px;padding:14px 16px 12px;min-width:240px;text-align:right">
        <div id="ch-rarity" style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;margin-bottom:2px">COMMON</div>
        <div id="ch-name" style="font-size:20px;font-weight:700;letter-spacing:0.04em;text-shadow:0 2px 8px rgba(0,0,0,0.8)">—</div>
        <div id="ch-slots" style="font-size:11px;opacity:0.6;margin-top:4px"></div>

        <div style="display:flex;align-items:flex-end;justify-content:flex-end;gap:10px;margin-top:10px">
          <div style="text-align:right">
            <div style="font-size:10px;letter-spacing:0.12em;opacity:0.55;margin-bottom:2px">MAG</div>
            <div id="ch-ammo-big" style="font-size:42px;font-weight:800;line-height:1;letter-spacing:0.04em;text-shadow:0 2px 10px rgba(0,0,0,0.75)">
              <span id="ch-mag">0</span>
            </div>
          </div>
          <div style="padding-bottom:6px;opacity:0.5;font-size:18px">/</div>
          <div style="text-align:left;padding-bottom:4px">
            <div style="font-size:10px;letter-spacing:0.12em;opacity:0.55;margin-bottom:2px">RESERVE</div>
            <div id="ch-res" style="font-size:22px;font-weight:700;opacity:0.85">0</div>
          </div>
        </div>

        <div id="ch-bullets"></div>

        <div id="ch-reload-inline" style="display:none;margin-top:10px">
          <div style="font-size:11px;color:#7fd4ff;letter-spacing:0.14em;margin-bottom:4px">RELOADING MAG…</div>
          <div style="height:8px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;border:1px solid rgba(127,212,255,0.3)">
            <div id="ch-reload" style="height:100%;width:0%;background:linear-gradient(90deg,#3a9fd4,#7fd4ff);box-shadow:0 0 10px rgba(127,212,255,0.5)"></div>
          </div>
        </div>
        <div id="ch-empty-hint" style="display:none;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#ff6a5a">
          PRESS R · RELOAD MAG
        </div>
      </div>

      <!-- Center reload banner -->
      <div class="panel" id="ch-reload-overlay">
        <div style="font-size:13px;letter-spacing:0.2em;color:#7fd4ff;font-weight:700">RELOADING</div>
        <div id="ch-reload-overlay-name" style="font-size:12px;opacity:0.7;margin-top:2px"></div>
        <div id="ch-reload-bar-bg"><div id="ch-reload-bar"></div></div>
      </div>

      <div id="ch-range" class="panel" style="position:absolute;left:50%;top:12px;transform:translateX(-50%);
        padding:7px 14px;font-size:11px;display:none"></div>

      <!-- Scope look-through: large clear center so peripherals stay visible -->
      <div id="ch-scope" style="
        position:absolute;inset:0;display:none;pointer-events:none;
        background: radial-gradient(circle at center,
          transparent 0%, transparent 48%,
          rgba(0,0,0,0.25) 56%, rgba(0,0,0,0.7) 68%, rgba(0,0,0,0.92) 78%);
      ">
        <svg id="ch-scope-reticle" width="100%" height="100%" style="position:absolute;inset:0">
          <g id="ch-scope-marks" stroke="#d0d8e0" stroke-width="1" opacity="0.8">
            <line x1="50%" y1="38%" x2="50%" y2="47%" />
            <line x1="50%" y1="53%" x2="50%" y2="62%" />
            <line x1="38%" y1="50%" x2="47%" y2="50%" />
            <line x1="53%" y1="50%" x2="62%" y2="50%" />
            <circle cx="50%" cy="46%" r="1.2" fill="#d0d8e0" />
            <circle cx="50%" cy="54%" r="1.2" fill="#d0d8e0" />
            <circle cx="46%" cy="50%" r="1.2" fill="#d0d8e0" />
            <circle cx="54%" cy="50%" r="1.2" fill="#d0d8e0" />
          </g>
          <circle cx="50%" cy="50%" r="1.6" fill="#ff3030" opacity="0.95" />
        </svg>
      </div>
    `,document.body.appendChild(this.root),this._els={hp:this.root.querySelector("#ch-hp"),ar:this.root.querySelector("#ch-ar"),name:this.root.querySelector("#ch-name"),rarity:this.root.querySelector("#ch-rarity"),slots:this.root.querySelector("#ch-slots"),mag:this.root.querySelector("#ch-mag"),ammoBig:this.root.querySelector("#ch-ammo-big"),res:this.root.querySelector("#ch-res"),bullets:this.root.querySelector("#ch-bullets"),reloadInline:this.root.querySelector("#ch-reload-inline"),reload:this.root.querySelector("#ch-reload"),reloadOverlay:this.root.querySelector("#ch-reload-overlay"),reloadBar:this.root.querySelector("#ch-reload-bar"),reloadOverlayName:this.root.querySelector("#ch-reload-overlay-name"),emptyHint:this.root.querySelector("#ch-empty-hint"),range:this.root.querySelector("#ch-range"),scope:this.root.querySelector("#ch-scope")},this._lastMagKey=""}setVisible(t){this.root.style.display=t?"block":"none"}_renderBullets(t,e){const n=`${t}/${e}`;if(n===this._lastMagKey)return;this._lastMagKey=n;const i=this._els.bullets;i.innerHTML="";const s=Math.min(e,40),o=e<=40?t:Math.round(t/e*s),a=e>0&&t/e<=.25,l=t<=0;for(let c=0;c<s;c++){const h=document.createElement("i");c>=o?h.classList.add("off"):l?h.classList.add("empty"):a&&h.classList.add("low"),i.appendChild(h)}}update(t,e=null){if(!t)return;const n=on[t.rarity]||on.common,i=`#${n.color.toString(16).padStart(6,"0")}`;this._els.name.textContent=t.name,this._els.name.style.color=i,this._els.rarity.textContent=n.label,this._els.rarity.style.color=i,this._els.mag.textContent=String(t.mag),this._els.res.textContent=String(t.reserve);const s=t.slot,o=t.slot0??"—",a=t.slot1??"—";if(this._els.slots.innerHTML=`<span style="opacity:${s===0?1:.45}">[1] ${o}</span>&nbsp;&nbsp;<span style="opacity:${s===1?1:.45}">[2] ${a}</span>`,this._els.ammoBig.classList.remove("empty","low"),t.mag<=0?this._els.ammoBig.classList.add("empty"):t.magSize>0&&t.mag/t.magSize<=.25&&this._els.ammoBig.classList.add("low"),this._renderBullets(t.mag,t.magSize),this._els.hp.style.width=`${Math.max(0,Math.min(100,t.health))}%`,this._els.ar.style.width=`${Math.max(0,Math.min(100,t.armor/150*100))}%`,t.reloading){const l=Math.round(t.reloadFrac*100);this._els.reloadInline.style.display="block",this._els.reload.style.width=`${l}%`,this._els.reloadOverlay.style.display="block",this._els.reloadBar.style.width=`${l}%`,this._els.reloadOverlayName.textContent=`${t.name}  ·  mag ${t.mag} → ${t.magSize}`,this._els.emptyHint.style.display="none"}else this._els.reloadInline.style.display="none",this._els.reloadOverlay.style.display="none",this._els.emptyHint.style.display=t.mag<=0&&t.reserve>0?"block":"none";if(e){this._els.range.style.display="block";const l=e.shots>0?(e.hits/e.shots*100).toFixed(0):"—";this._els.range.textContent=`TEST RANGE  ·  shots ${e.shots}  hits ${e.hits}  acc ${l}%  dmg ${e.damage.toFixed(0)}  HS ${e.headshots}  ·  P to clear`}else this._els.range.style.display="none";if(this._els.scope){const l=!!(t.scopeOverlay&&t.ads>.55);if(this._els.scope.style.display=l?"block":"none",l){const c=Math.min(1,(t.ads-.55)/.45);this._els.scope.style.opacity=String(c);const h=t.weaponClass==="dmr"||t.weaponClass==="marksman";this._els.scope.style.background=h?`radial-gradient(circle at center,
              transparent 0%, transparent 58%,
              rgba(0,0,0,0.2) 66%, rgba(0,0,0,0.55) 76%, rgba(0,0,0,0.88) 88%)`:`radial-gradient(circle at center,
              transparent 0%, transparent 48%,
              rgba(0,0,0,0.25) 56%, rgba(0,0,0,0.7) 68%, rgba(0,0,0,0.92) 78%)`}}}}function ov(){var a;const r=_r(dt.SEED^24378),t=new Q_(dt.SEED),e=new ex,n=new sx;Ux(n,t,r);const i=Hx(n,t,r),s=zx(n,t,r),o=n.buildMeshes();return n.registerCollision(e),{terrain:t,hash:e,sink:n,propStats:s,structureStats:i,roadPieces:((a=t.roads)==null?void 0:a.length)??0,structureMeshes:o}}function av(r){const t=new gd(dt.AMBIENT_SKY,dt.AMBIENT_GROUND,dt.AMBIENT_INTENSITY);r.add(t);const e=new lr(dt.SUN_COLOR,dt.SUN_INTENSITY),n=dt.SUN_ELEVATION_DEG*Math.PI/180,i=dt.SUN_AZIMUTH_DEG*Math.PI/180;e.position.set(Math.cos(n)*Math.sin(i)*300,Math.sin(n)*300,Math.cos(n)*Math.cos(i)*300),e.castShadow=!0,e.shadow.mapSize.set(dt.SHADOW_MAP_SIZE,dt.SHADOW_MAP_SIZE);const s=dt.SHADOW_BOX/2;return e.shadow.camera.left=-s,e.shadow.camera.right=s,e.shadow.camera.top=s,e.shadow.camera.bottom=-s,e.shadow.camera.near=1,e.shadow.camera.far=700,e.shadow.bias=-6e-4,e.shadow.normalBias=.035,r.add(e),r.add(e.target),e}async function lv(){const r=new z_,t=new Zg({antialias:!0,powerPreference:"high-performance"});t.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),t.setSize(window.innerWidth,window.innerHeight),t.shadowMap.enabled=!0,t.shadowMap.type=Ph,t.outputColorSpace=Be,document.body.appendChild(t.domElement);const e=new ld;e.background=new Lt(dt.SKY_COLOR),e.fog=new Rl(dt.SKY_COLOR,dt.FOG_NEAR,dt.FOG_FAR);const n=av(e),i=performance.now(),{terrain:s,hash:o,sink:a,propStats:l,structureStats:c,roadPieces:h,structureMeshes:d}=ov(),u=await EM(),f=TM(e,o,s,_r(dt.SEED^677351),u,{count:160}),m=performance.now()-i;e.add(s.buildMesh()),e.add(s.buildWater());for(const J of d)e.add(J);const _=new ux(o),p=_.buildFromRegistry();e.add(_.group);const g=new fx(o),x=g.buildFromRegistry();e.add(g.group);const M=new PM(s,o,r);M.pos.y=s.heightAt(Kt.SPAWN.x,Kt.SPAWN.z)+.5,M.prevPos.copy(M.pos);const y=new FM(window.innerWidth/window.innerHeight),A=new G_(t.domElement,r),w=zM(),E=new rv,L=new BM(t),U=new HM(s),v=new H_,S=new GM(e,y.camera),I=new QM(t);I.setAspect(window.innerWidth/window.innerHeight);const D=new xo(y,o,r,S);D.attachOverlay(I);const F=await VM();D.setWeaponModels(F.byClass),D.giveWeapon("vector7","common");const q=new sv(e,s,r);q.setWeaponModels(F.byClass);const O=q.populate(dt.SEED^4103);O.items;const z=new nv(e,s),G=new iv(e,s,o,r),et=G.spawn(),K=_r(dt.SEED^49335);let j=!1;const pt=[];r.on("pointerlock",J=>{w.setLocked(J),E.setVisible(J),!J&&U.open&&!U._suppressLockClose&&U.setOpen(!1)}),r.on("pointerlock:error",()=>{w.setError("Pointer lock was blocked by the browser. Click again in a moment.")}),w.setLocked(!1),E.setVisible(!1),window.addEventListener("resize",()=>{t.setSize(window.innerWidth,window.innerHeight),y.setAspect(window.innerWidth/window.innerHeight),I.setAspect(window.innerWidth/window.innerHeight)});const It=n.position.clone(),X={aabbs:o.count,props:l.placed,seed:dt.SEED};console.info(`[world] generated in ${m.toFixed(0)}ms · ${a.total} boxes · ${o.count} collision AABBs · ${l.placed}/${l.attempts} box-props · ${f.placed} glb-props · doors ${p} · elevators ${x} · loot ${O.items??0} items + ${O.cases??0} cases · bots ${et} · road segs ${h} · structures ${JSON.stringify(c)}`);const $=document.getElementById("loading");$&&$.remove();function rt(){if(requestAnimationFrame(rt),A.locked&&!U.open){const{dx:st,dy:lt}=A.consumeMouse();y.applyMouse(st,lt)}else A.consumeMouse();A.actionPressed("debug")&&L.toggle(),A.actionPressed("map")&&U.toggle(),A.actionPressed("testRange")&&A.locked&&z.toggle(M.pos),v.advance(st=>{if(M.ads=A.locked&&A.buttons.has(2)&&!U.open,A.locked&&!U.open){A.actionPressed("weapon1")&&D.selectSlot(0),A.actionPressed("weapon2")&&D.selectSlot(1),A.actionPressed("quickSwap")&&D.quickSwap(),A.actionPressed("reload")&&D.startReload(),A.actionPressed("interact")&&(q.tryPickup(D,M.pos.x,M.pos.y+M.height*.35,M.pos.z)||g.tryUse(M)||_.tryToggle(M.pos.x,M.pos.y+M.height*.5,M.pos.z)),M.tick(st,A,y.yaw),g.update(st,M);const lt=M.speed>.6;G.update(st,M.pos,D),pt.length=0;const ot=G.getLiveTargets();for(let Ct=0;Ct<ot.length;Ct++)pt.push(ot[Ct]);if(z.active){const Ct=z.getLiveTargets();for(let N=0;N<Ct.length;N++)pt.push(Ct[N])}const wt=A.buttons.has(0);wt&&!j&&D.firePressed(pt,z.active?z:null,K,lt),j=wt,D.tick(st,A,pt,z.active?z:null,K,lt)}else M.tick(st,cv,y.yaw),g.update(st,null),G.update(st,null,null),j=!1;_.update(st),q.update(st),A.endTick()});const J=A.locked&&!U.open?(A.action("right")?1:0)-(A.action("left")?1:0):0;y.update(v.frameDelta,M,v.alpha,J);{const st=y.fov,lt=D.def,ot=(lt==null?void 0:lt.scopeZoomFov)??48,wt=Fe.lerp(st,ot,D.ads);Math.abs(y.camera.fov-wt)>.05&&(y.camera.fov=wt,y.camera.updateProjectionMatrix());const Ct=Fe.lerp(50,lt!=null&&lt.scopeOverlay?38:42,D.ads);Math.abs(I.camera.fov-Ct)>.1&&(I.camera.fov=Ct,I.camera.updateProjectionMatrix())}if(n.target.position.set(M.pos.x,M.pos.y,M.pos.z),n.position.copy(n.target.position).add(It),n.target.updateMatrixWorld(),S.update(v.frameDelta),A.locked&&!U.open){const st=M.pos.x,lt=M.pos.y+M.height*.5,ot=M.pos.z;w.setPrompt(q.prompt(st,lt,ot)||g.prompt(st,lt,ot)||_.prompt(st,lt,ot))}else w.setPrompt(null);E.update(D.hudState(),z.active?z.stats:null),t.render(e,y.camera),A.locked&&I.render(),U.update(M.pos,y.yaw),L.update(v.frameDelta,M,X)}requestAnimationFrame(rt),window.__game={scene:e,renderer:t,controller:M,terrain:s,hash:o,playerCam:y,stats:X,clock:v,SIM:Bi,mapView:U,weapons:D,loot:q,testRange:z,effects:S}}const cv={action:()=>!1,actionPressed:()=>!1,buttons:new Set};requestAnimationFrame(()=>requestAnimationFrame(lv));
