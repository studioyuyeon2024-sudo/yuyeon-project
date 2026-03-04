import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let currentData = [];

window.checkAdmin = function() {
    if(document.getElementById('admin-password').value === "dbdus2024") {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        loadAllData();
    } else { alert("비밀번호가 틀렸습니다."); }
}

async function loadAllData() {
    const querySnapshot = await getDocs(collection(db, "participants"));
    const all = [];
    querySnapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
    currentData = all;
    const list = document.getElementById('participant-list');
    list.innerHTML = "";
    all.sort((a,b) => a.myId - b.myId).forEach(p => {
        list.innerHTML += `<tr><td>${p.myId}</td><td>${p.gender}</td><td>${p.realName}</td><td>${p.phone}</td><td>${p.pickId1}</td><td>${p.pickId2}</td><td>${p.review}</td></tr>`;
    });
}

// 결과 공개 승인/차단 로직
document.getElementById('open-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: true });
    alert("결과 공개를 승인했습니다!");
};
document.getElementById('close-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: false });
    alert("결과 공개를 차단했습니다.");
};

// 엑셀 다운로드 및 초기화 (기존 로직 동일하게 포함)
document.getElementById('refresh-btn').onclick = loadAllData;
document.getElementById('download-btn').onclick = () => {
    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2,후기\n";
    currentData.forEach(p => csv += `${p.myId},${p.gender},${p.realName},${p.phone},${p.pickId1},${p.pickId2},${p.review}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "유연_명단.csv"; link.click();
};
document.getElementById('delete-btn').onclick = async () => {
    if(confirm("모두 삭제하시겠습니까?")) {
        const querySnapshot = await getDocs(collection(db, "participants"));
        await Promise.all(querySnapshot.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
        alert("삭제 완료"); location.reload();
    }
};
