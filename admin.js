import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentData = [];

const EXPORT_PASSWORD = "yuyeon_secure_777"; // 2차 비밀번호

window.checkAdmin = async function() {
    const email = document.getElementById('admin-email').value;
    const pw = document.getElementById('admin-password').value;
    try { await signInWithEmailAndPassword(auth, email, pw); } 
    catch (e) { alert("로그인 실패"); }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        updateDashboard();
    }
});

async function updateDashboard() {
    try {
        const snap = await getDocs(collection(db, "participants"));
        currentData = []; snap.forEach(d => currentData.push({ id: d.id, ...d.data() }));

        const voteMap = {};
        currentData.forEach(p => { 
            if(p.pickId1) voteMap[p.pickId1] = (voteMap[p.pickId1] || 0) + 1;
            if(p.pickId2) voteMap[p.pickId2] = (voteMap[p.pickId2] || 0) + 1;
        });

        const listBody = document.getElementById('participant-list');
        listBody.innerHTML = "";
        currentData.sort((a,b) => a.myId - b.myId).forEach(p => {
            listBody.innerHTML += `
                <tr>
                    <td>${p.myId}</td>
                    <td>${p.gender==='male'?'남':'여'}</td>
                    <td>${p.realName}</td>
                    <td>${p.phone}</td>
                    <td>${p.pickId1||'-'},${p.pickId2||'-'}</td>
                    <td style="color:#FF5252; font-weight:bold;">${voteMap[p.myId]||0}표</td>
                    <td class="review-cell">${p.review || '-'}</td>
                </tr>`;
        });

        const males = currentData.filter(p => p.gender === 'male');
        const females = currentData.filter(p => p.gender === 'female');
        const miniMatchArea = document.getElementById('final-matches-mini');
        miniMatchArea.innerHTML = "";
        
        let coupleCount = 0; let matchedIds = new Set();
        males.forEach(m => {
            females.forEach(f => {
                if ([m.pickId1, m.pickId2].includes(f.myId) && [f.pickId1, f.pickId2].includes(m.myId)) {
                    coupleCount++; matchedIds.add(m.myId); matchedIds.add(f.myId);
                    miniMatchArea.innerHTML += `<div style='padding:10px; background:#f0f4ff; border-radius:12px; margin-bottom:8px; font-size:13px;'><b>${m.myId}(${m.realName}/${m.phone})</b> ❤️ <b>${f.myId}(${f.realName}/${f.phone})</b></div>`;
                }
            });
        });

        document.getElementById('stat-total').innerText = currentData.length;
        document.getElementById('stat-gender').innerText = `${males.length}/${females.length}`;
        document.getElementById('stat-couples').innerText = `${coupleCount}쌍`;
        document.getElementById('stat-rate').innerText = `${currentData.length>0?Math.round((matchedIds.size/currentData.length)*100):0}%`;
    } catch(e) { console.error(e); }
}

function verify() { return prompt("2차 비밀번호를 입력하세요.") === EXPORT_PASSWORD; }

document.getElementById('open-btn').onclick = async () => { if(confirm("공개하시겠습니까?")) { await setDoc(doc(db, "settings", "matching_status"), { is_open: true }); alert("공개 완료"); } };
document.getElementById('close-btn').onclick = async () => { if(confirm("차단하시겠습니까?")) { await setDoc(doc(db, "settings", "matching_status"), { is_open: false }); alert("차단 완료"); } };

document.getElementById('delete-btn').onclick = async () => {
    const batch = prompt("백업할 기수 이름을 입력하세요");
    if (!batch || !verify()) return;
    try {
        const btn = document.getElementById('delete-btn'); btn.disabled = true; btn.innerText = "⏳ 처리 중...";
        const backupPromises = currentData.map(p => {
            const { id, ...pureData } = p;
            return setDoc(doc(db, "archive", `${batch}_${p.phone}`), { ...pureData, batchName: batch, archivedAt: new Date() });
        });
        await Promise.all(backupPromises);
        const snap = await getDocs(collection(db, "participants"));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
        alert(`${batch} 백업 완료!`); location.reload();
    } catch(e) { alert("오류: " + e.message); btn.disabled = false; btn.innerText = "⚠️ 초기화"; }
};

document.getElementById('refresh-btn').onclick = updateDashboard;
