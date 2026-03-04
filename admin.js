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

window.checkAdmin = async function() {
    const email = document.getElementById('admin-email').value;
    const pw = document.getElementById('admin-password').value;
    try { await signInWithEmailAndPassword(auth, email, pw); } 
    catch (err) { alert("로그인 실패"); }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        updateDashboard();
    }
});

async function updateDashboard() {
    const snap = await getDocs(collection(db, "participants"));
    const all = []; snap.forEach(d => all.push({ id: d.id, ...d.data() }));
    currentData = all;

    const listBody = document.getElementById('participant-list');
    listBody.innerHTML = "";
    all.sort((a,b) => a.myId - b.myId).forEach(p => {
        listBody.innerHTML += `<tr><td>${p.myId}</td><td>${p.gender === 'male'?'남':'여'}</td><td>${p.realName}</td><td>${p.phone}</td><td>${p.pickId1||'-'}</td><td>${p.pickId2||'-'}</td></tr>`;
    });

    const males = all.filter(p => p.gender === 'male');
    const females = all.filter(p => p.gender === 'female');
    const matchArea = document.getElementById('final-matches-admin');
    matchArea.innerHTML = "<h3 style='color:#1A237E;'>💖 매칭 커플</h3>";
    
    let coupleCount = 0;
    const matchedIds = new Set();
    males.forEach(man => {
        const manPicks = [man.pickId1, man.pickId2];
        females.forEach(woman => {
            const womanPicks = [woman.pickId1, woman.pickId2];
            if (manPicks.includes(woman.myId) && womanPicks.includes(man.myId)) {
                coupleCount++; matchedIds.add(man.myId); matchedIds.add(woman.myId);
                matchArea.innerHTML += `<div style='background:#f0f4ff; padding:10px; border-radius:10px; margin-bottom:5px;'>${man.myId}번(${man.realName}) ❤️ ${woman.myId}번(${woman.realName})</div>`;
            }
        });
    });

    document.getElementById('stat-total').innerText = `${all.length}명`;
    document.getElementById('stat-gender').innerText = `${males.length} / ${females.length}`;
    document.getElementById('stat-couples').innerText = `${coupleCount}쌍`;
    const rate = all.length > 0 ? Math.round((matchedIds.size / all.length) * 100) : 0;
    document.getElementById('stat-rate').innerText = `${rate}%`;
}

// [핵심 업데이트] 기수 이름 입력 및 백업 초기화 로직
// admin.js 의 delete-btn 부분을 이 코드로 교체하세요.

document.getElementById('delete-btn').onclick = async () => {
    if (currentData.length === 0) return alert("데이터가 없습니다.");
    
    const batchName = prompt("백업할 기수 이름을 입력하세요 (예: 유연 132기)", "유연 132기");
    if (!batchName) return;

    if (confirm(`[${batchName}] 명단으로 백업 후 현재 명단을 초기화하시겠습니까?`)) {
        try {
            const btn = document.getElementById('delete-btn');
            btn.disabled = true;
            btn.innerText = "⏳ 처리 중...";

            // 1. 백업 창고(archive)로 복사
            const backupPromises = currentData.map(p => {
                // 기존 데이터에서 id 필드가 있으면 충돌할 수 있으므로 제거 후 저장
                const { id, ...pureData } = p; 
                const backupId = `${batchName}_${p.phone}_${new Date().getTime()}`;
                return setDoc(doc(db, "archive", backupId), { 
                    ...pureData, 
                    batchName: batchName, 
                    archivedAt: new Date() 
                });
            });
            await Promise.all(backupPromises);

            // 2. 원본 데이터(participants) 삭제
            const snap = await getDocs(collection(db, "participants"));
            const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "participants", d.id)));
            await Promise.all(deletePromises);

            alert(`${batchName} 백업 및 초기화 완료!`);
            location.reload();
        } catch (e) {
            console.error(e);
            // 구체적인 에러 내용을 띄워줍니다.
            alert("오류 발생: " + e.message); 
            btn.disabled = false;
            btn.innerText = "⚠️ 기수 백업 및 초기화";
        }
    }
};

document.getElementById('open-btn').onclick = async () => await setDoc(doc(db, "settings", "matching_status"), { is_open: true });
document.getElementById('close-btn').onclick = async () => await setDoc(doc(db, "settings", "matching_status"), { is_open: false });
document.getElementById('refresh-btn').onclick = updateDashboard;
document.getElementById('download-btn').onclick = () => {
    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2\n";
    currentData.forEach(p => csv += `${p.myId},${p.gender},${p.realName},${p.phone},${p.pickId1},${p.pickId2}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "유연_명단.csv"; link.click();
};
