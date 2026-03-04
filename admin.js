import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCy0qWrPE_aQGaKjJXIM_vgU8oO5Wq9mOI",
  authDomain: "my-dating-service.firebaseapp.com",
  projectId: "my-dating-service",
  storageBucket: "my-dating-service.firebasestorage.app",
  messagingSenderId: "231488184905",
  appId: "1:231488184905:web:d49b3e4f0ef35e524e5598"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentData = [];

const EXPORT_PASSWORD = "2024"; 

window.checkAdmin = async function() {
    const email = document.getElementById('admin-email').value;
    const pw = document.getElementById('admin-password').value;
    try { await signInWithEmailAndPassword(auth, email, pw); } catch (e) { alert("로그인 실패"); }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        updateDashboard();
    }
});

async function updateDashboard() {
    const snap = await getDocs(collection(db, "participants"));
    currentData = []; snap.forEach(d => currentData.push({ id: d.id, ...d.data() }));
    
    const listBody = document.getElementById('participant-list');
    listBody.innerHTML = "";
    currentData.sort((a,b) => a.myId - b.myId).forEach(p => {
        listBody.innerHTML += `<tr><td>${p.myId}</td><td>${p.gender==='male'?'남':'여'}</td><td>${p.realName}</td><td>${p.phone}</td><td>${p.pickId1||'-'},${p.pickId2||'-'}</td></tr>`;
    });

    const males = currentData.filter(p => p.gender === 'male');
    const females = currentData.filter(p => p.gender === 'female');
    const matchArea = document.getElementById('final-matches-admin');
    matchArea.innerHTML = "<h4>💖 매칭 결과</h4>";
    
    let coupleCount = 0; let matchedIds = new Set();
    males.forEach(m => {
        females.forEach(f => {
            if ([m.pickId1, m.pickId2].includes(f.myId) && [f.pickId1, f.pickId2].includes(m.myId)) {
                coupleCount++; matchedIds.add(m.myId); matchedIds.add(f.myId);
                matchArea.innerHTML += `<div style='font-size:13px; margin-bottom:5px;'>${m.myId}(${m.realName}) ❤️ ${f.myId}(${f.realName})</div>`;
            }
        });
    });

    document.getElementById('stat-total').innerText = currentData.length;
    document.getElementById('stat-gender').innerText = `${males.length}/${females.length}`;
    document.getElementById('stat-couples').innerText = coupleCount;
    document.getElementById('stat-rate').innerText = `${currentData.length>0?Math.round((matchedIds.size/currentData.length)*100):0}%`;
}

function verify() {
    return prompt("보안 비번 입력") === EXPORT_PASSWORD;
}

document.getElementById('open-btn').onclick = async () => {
    if(confirm("공개할까요?")) { await setDoc(doc(db, "settings", "matching_status"), { is_open: true }); alert("공개됨"); }
};

document.getElementById('download-btn').onclick = () => {
    if(!verify()) return;
    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2\n";
    currentData.forEach(p => csv += `${p.myId},${p.gender},${p.realName},${p.phone},${p.pickId1},${p.pickId2}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "현재명단.csv"; link.click();
};

document.getElementById('download-archive-btn').onclick = async () => {
    if(!verify()) return;
    const snap = await getDocs(collection(db, "archive"));
    let csv = "\uFEFF기수,번호,성별,이름,연락처\n";
    snap.forEach(d => { const p = d.data(); csv += `${p.batchName},${p.myId},${p.gender},${p.realName},${p.phone}\n`; });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "백업데이터.csv"; link.click();
};

document.getElementById('delete-btn').onclick = async () => {
    const batch = prompt("기수 이름 (예: 유연 132기)");
    if (!batch || !confirm(`${batch}로 백업 후 삭제할까요?`)) return;
    try {
        const backupPromises = currentData.map(p => setDoc(doc(db, "archive", `${batch}_${p.phone}`), { ...p, batchName: batch, archivedAt: new Date() }));
        await Promise.all(backupPromises);
        const snap = await getDocs(collection(db, "participants"));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
        alert("완료"); location.reload();
    } catch(e) { alert("에러"); }
};

document.getElementById('refresh-btn').onclick = updateDashboard;
document.getElementById('close-btn').onclick = async () => { await setDoc(doc(db, "settings", "matching_status"), { is_open: false }); alert("차단됨"); };
