import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentData = []; // 엑셀 다운로드를 위한 임시 저장소

// [1] 관리자 암호 체크
window.checkAdmin = function() {
    const pw = document.getElementById('admin-password').value;
    if(pw === "dbdus2024") {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        loadAllData();
    } else {
        alert("암호가 틀렸습니다.");
    }
}

// [2] 데이터 불러오기 및 매칭 분석
async function loadAllData() {
    try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const all = [];
        querySnapshot.forEach(doc => all.push({ id: doc.id, ...doc.data() }));
        currentData = all;

        // 명단 출력
        const listTable = document.getElementById('participant-list');
        listTable.innerHTML = "";
        all.sort((a, b) => a.myId - b.myId);

        all.forEach(p => {
            const tr = `<tr>
                <td>${p.myId}</td>
                <td>${p.gender === 'male' ? '남' : '여'}</td>
                <td>${p.realName || '이름없음'}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.pickId1 || '-'}</td>
                <td>${p.pickId2 || '-'}</td>
                <td style="font-size: 10px;">${p.review || '-'}</td>
            </tr>`;
            listTable.innerHTML += tr;
        });

        // 매칭 분석
        const finalMatches = document.getElementById('final-matches');
        finalMatches.innerHTML = "";
        const males = all.filter(p => p.gender === 'male');
        const females = all.filter(p => p.gender === 'female');
        let coupleCount = 0;

        males.forEach(man => {
            const myPicks = [man.pickId1, man.pickId2].filter(id => id);
            females.forEach(woman => {
                const herPicks = [woman.pickId1, woman.pickId2].filter(id => id);
                if (myPicks.includes(woman.myId) && herPicks.includes(man.myId)) {
                    coupleCount++;
                    const div = document.createElement('div');
                    div.className = "match-card";
                    div.innerHTML = `<strong>커플 ${coupleCount}</strong>: 남${man.myId}(${man.realName}) ❤️ 여${woman.myId}(${woman.realName}) <br><small>연락처: ${man.phone} / ${woman.phone}</small>`;
                    finalMatches.appendChild(div);
                }
            });
        });

        if(coupleCount === 0) finalMatches.innerHTML = "<p>아직 매칭된 커플이 없습니다.</p>";
    } catch (err) {
        alert("데이터 로드 실패: " + err.message);
    }
}

// [3] 엑셀(CSV) 저장 기능
function downloadExcel() {
    if (currentData.length === 0) {
        alert("다운로드할 데이터가 없습니다. 먼저 새로고침을 눌러주세요.");
        return;
    }
    let csvContent = "\uFEFF"; 
    csvContent += "번호,성별,이름,연락처,1지망,2지망,후기\n";
    currentData.forEach(p => {
        const row = [p.myId, p.gender === 'male' ? '남' : '여', p.realName, p.phone, p.pickId1, p.pickId2 || '-', `"${(p.review || '').replace(/"/g, '""')}"`].join(",");
        csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `유연_참가자명단_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

// [4] 전체 데이터 삭제 기능
async function deleteAllData() {
    if (!confirm("⚠️ 정말로 모든 참가자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "participants", d.id)));
        await Promise.all(deletePromises);
        alert("모든 데이터가 삭제되었습니다.");
        location.reload();
    } catch (err) {
        alert("삭제 중 오류 발생: " + err.message);
    }
}

// [5] 버튼과 함수 연결 (이 부분이 있어야 버튼이 작동합니다!)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refresh-btn').onclick = loadAllData;
    document.getElementById('download-btn').onclick = downloadExcel;
    document.getElementById('delete-all-btn').onclick = deleteAllData;
});
