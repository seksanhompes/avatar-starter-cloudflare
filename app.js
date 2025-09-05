import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMUtils } from "https://unpkg.com/@pixiv/three-vrm@2.0.7/lib/three-vrm.module.js";


let vrm, renderer, camera, scene, controls, clock = new THREE.Clock();
const canvas = document.getElementById("canvas");
const slSmile = document.getElementById("slSmile");
const slBlink = document.getElementById("slBlink");
const hairColor = document.getElementById("hairColor");
let turnstileToken = null;

window.onTurnstile = (t) => { turnstileToken = t; };

async function api(url, opts={}){
  const r = await fetch(url, { headers:{ "content-type":"application/json" }, credentials:"include", ...opts });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

async function startSession(){
  if(!turnstileToken) { alert("ยังไม่ผ่าน Turnstile"); return; }
  const handle = document.getElementById("handle").value || null;
  await api("/api/session/start", { method:"POST", body:JSON.stringify({ token: turnstileToken, handle }) });
  document.getElementById("btnSave").disabled = false;
  document.getElementById("btnUpload").disabled = false;
  await loadCharacter(); // ลองดึง config เก่าถ้ามี
}

async function saveCharacter(){
  const cfg = getConfigFromUI();
  await api("/api/character/save", { method:"POST", body:JSON.stringify({ avatar_config: cfg }) });
  alert("บันทึกแล้ว");
}

async function uploadVRM(file){
  const buf = await file.arrayBuffer();
  const r = await fetch("/api/character/upload", { method:"POST", body: buf, headers:{ "content-type": file.type || "application/octet-stream" }, credentials:"include" });
  const d = await r.json();
  if(!d.ok) { alert(d.error||"upload failed"); return;}
  alert("อัปโหลดสำเร็จ\n"+d.url);
}

function getConfigFromUI(){
  return {
    expressions: { smile: +slSmile.value, blink: +slBlink.value },
    colors: { hair: hairColor.value }
  };
}

function applyConfig(cfg){
  if(!cfg) return;
  const ex = cfg.expressions||{};
  setExpr("happy", ex.smile ?? 0.3);
  setExpr("blink", ex.blink ?? 0.2);

  const clr = cfg.colors?.hair;
  if(clr) setHairColor(clr);
}

async function loadCharacter(){
  const res = await api("/api/character/get", { method:"GET" });
  if(res?.data?.avatar_config) applyConfig(res.data.avatar_config);
}

function setExpr(name, value){
  if(!vrm) return;
  const em = vrm.expressionManager;
  if(!em) return;
  if(name==="happy"||name==="joy") em.setValue("happy", value);
  if(name==="blink") em.setValue("blink", value);
}

function setHairColor(hex){
  if(!vrm) return;
  const col = new THREE.Color(hex);
  vrm.scene.traverse((o)=>{
    if(o.isMesh && o.material){
      const mat = o.material;
      const name = (mat.name||"").toLowerCase();
      const oname = (o.name||"").toLowerCase();
      if(name.includes("hair") || oname.includes("hair")){
        if(mat.color) mat.color.copy(col);
      }
    }
  });
}

async function init(){
  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  renderer.setSize(window.innerWidth, window.innerHeight*0.7);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, window.innerWidth/(window.innerHeight*0.7), 0.1, 1000);
  camera.position.set(0, 1.35, 2.2);

  const controlsMod = OrbitControls;
  controls = new controlsMod(camera, renderer.domElement);
  controls.target.set(0, 1.35, 0);
  controls.enableDamping = true;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(2,3,2);
  scene.add(hemi, dir);

  const loader = new GLTFLoader();
  loader.load("/models/base.vrm", (gltf)=>{
    VRMUtils.removeUnnecessaryJoints(gltf.scene);
    VRM.from(gltf).then((_vrm)=>{
      vrm = _vrm;
      vrm.scene.rotation.y = Math.PI;
      scene.add(vrm.scene);
      applyConfig(getConfigFromUI());
      renderLoop();
    });
  }, undefined, (err)=>{
    console.warn("โหลด base.vrm ไม่ได้:", err);
  });

  window.addEventListener("resize", ()=>{
    renderer.setSize(window.innerWidth, window.innerHeight*0.7);
    camera.aspect = window.innerWidth/(window.innerHeight*0.7);
    camera.updateProjectionMatrix();
  });

  document.getElementById("btnLogin").onclick = startSession;
  document.getElementById("btnSave").onclick = saveCharacter;
  document.getElementById("btnUpload").onclick = async ()=>{
    const f = await pickFile(".vrm");
    if(f) uploadVRM(f);
  };

  slSmile.oninput = ()=> setExpr("happy", +slSmile.value);
  slBlink.oninput = ()=> setExpr("blink", +slBlink.value);
  hairColor.oninput = ()=> setHairColor(hairColor.value);
}

function renderLoop(){
  const dt = clock.getDelta();
  if(vrm) vrm.update(dt);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}

function pickFile(accept){
  return new Promise((resolve)=>{
    const i = document.createElement("input");
    i.type = "file"; i.accept = accept;
    i.onchange = ()=> resolve(i.files?.[0] || null);
    i.click();
  })
}

init();
