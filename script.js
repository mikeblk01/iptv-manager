let channels = [];

// Cargar lista desde carpeta resources
async function loadLocal(){
let file = document.getElementById("fileInput").value;
if(!file){ alert("Pon el nombre del archivo"); return; }
let path = "resources/" + file;

try{
let res = await fetch(path);
if(!res.ok) throw new Error("No se encontró el archivo");
let text = await res.text();
parseM3U(text);
}catch(e){
alert("Error: " + e.message);
}
}

// Parsear M3U
function parseM3U(text){
let lines = text.split("\n");
for(let i=0;i<lines.length;i++){
if(lines[i].startsWith("#EXTINF")){
let info = lines[i];
let url = lines[i+1];
let name = info.split(",")[1];
let epg = (info.match(/tvg-id="([^"]+)"/)||[])[1] || "";
let group = (info.match(/group-title="([^"]+)"/)||[])[1] || "";
let logo = (info.match(/tvg-logo="([^"]+)"/)||[])[1] || "";
channels.push({name,epg,group,logo,url,status:"⏳"});
}
}
render();
}

// Renderizar tabla
function render(){
let table = document.querySelector("#channels tbody");
table.innerHTML="";
channels.forEach((c,i)=>{
table.innerHTML += `
<tr>
<td><input type="checkbox" data-i="${i}"></td>
<td contenteditable>${c.name}</td>
<td contenteditable>${c.epg}</td>
<td contenteditable>${c.group}</td>
<td contenteditable>${c.logo}</td>
<td>${c.url}</td>
<td id="status-${i}">${c.status}</td>
</tr>`;
});
}

// Seleccionar todo
function selectAll(){
document.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked = true);
}

// Eliminar seleccionados
function removeSelected(){
channels = channels.filter((c,i)=> !document.querySelectorAll("input[type=checkbox]")[i].checked );
render();
}

// Agregar canal manual
function addManual(){
channels.push({name:"Nuevo Canal",epg:"",group:"Manual",logo:"",url:"http://",status:""});
render();
}

// Verificar si canal carga
async function checkStream(url,index){
let video = document.createElement("video");
video.src = url;
video.muted = true;
let timeout = setTimeout(()=>{
document.getElementById("status-"+index).innerHTML="🔴";
video.remove();
},6000);

video.onloadeddata = ()=>{
clearTimeout(timeout);
document.getElementById("status-"+index).innerHTML="🟢";
video.remove();
};
video.onerror = ()=>{
clearTimeout(timeout);
document.getElementById("status-"+index).innerHTML="🔴";
video.remove();
};
}

function checkAll(){
channels.forEach((c,i)=>checkStream(c.url,i));
}

// Exportar lista
function exportM3U(){
let output = "#EXTM3U\n";
document.querySelectorAll("#channels tbody tr").forEach(row=>{
let name=row.children[1].innerText;
let epg=row.children[2].innerText;
let group=row.children[3].innerText;
let logo=row.children[4].innerText;
let url=row.children[5].innerText;
output+=`#EXTINF:-1 tvg-id="${epg}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
output+=`${url}\n`;
});
let blob=new Blob([output],{type:"text/plain"});
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="playlist.m3u";
a.click();
}

// Link temporal
function generateLink(){
let output = "#EXTM3U\n";
document.querySelectorAll("#channels tbody tr").forEach(row=>{
let name=row.children[1].innerText;
let epg=row.children[2].innerText;
let group=row.children[3].innerText;
let logo=row.children[4].innerText;
let url=row.children[5].innerText;
output+=`#EXTINF:-1 tvg-id="${epg}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
output+=`${url}\n`;
});
let blob = new Blob([output], {type:"text/plain"});
let link = URL.createObjectURL(blob);
prompt("Copia este link (temporal):", link);
}

// Guardar en GitHub
async function saveToGitHub(){
let token = prompt("Pon tu token de GitHub");
let repo = prompt("Usuario/repositorio (ej: mike/iptv-manager)");
let path = "playlist.m3u";
if(!token || !repo){ alert("Faltan datos"); return; }

let output = "#EXTM3U\n";
document.querySelectorAll("#channels tbody tr").forEach(row=>{
let name=row.children[1].innerText;
let epg=row.children[2].innerText;
let group=row.children[3].innerText;
let logo=row.children[4].innerText;
let url=row.children[5].innerText;
output+=`#EXTINF:-1 tvg-id="${epg}" tvg-logo="${logo}" group-title="${group}",${name}\n`;
output+=`${url}\n`;
});

let content = btoa(unescape(encodeURIComponent(output)));
let api = `https://api.github.com/repos/${repo}/contents/${path}`;

let sha = null;
try{
let res = await fetch(api,{headers:{Authorization:"token "+token}});
let data = await res.json();
sha = data.sha;
}catch(e){}

let res = await fetch(api,{
method:"PUT",
headers:{
Authorization:"token "+token,
"Content-Type":"application/json"
},
body: JSON.stringify({
message:"update playlist",
content:content,
sha:sha
})
});

if(res.ok){
alert("🔥 Lista guardada en GitHub");
let raw = `https://raw.githubusercontent.com/${repo}/main/playlist.m3u`;
prompt("Usa este link en TiviMate:", raw);
}else{
alert("Error subiendo archivo");
}
}
