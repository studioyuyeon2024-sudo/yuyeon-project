import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 관리자 암호 체크 (임시로 'yuyeon123' 설정)
window.checkAdmin = function() {
    const pw = document.getElementById('admin-password').value;
    if(pw === "yuyeon123") {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        loadAllData();
    } else {
        alert("암호가 틀렸습니다.");
    }
}

async function loadAllData() {
    const querySnapshot = await getDocs(collection(db, "participants"));
    const all = [];
    querySnapshot.forEach(doc => all.push(doc.data()));

    // 1. 명단 출력
    const listTable = document.getElementById('participant-list');
    listTable.innerHTML = "";
    all.sort((a, b) => a.myId - b.myId); // 번호순 정렬

    all.forEach(p => {
        const tr = `<tr>
            <td>${p.myId}</td>
            <td>${p.gender === 'male' ? '남' : '여'}</td>
            <td>${p.realName}</td>
            <td>${p.phone}</td>
            <td>${p.pickId1}</td>
            <td>${p.pickId2 || '-'}</td>
            <td style="font-size: 10px;">${p.review || '-'}</td>
        </tr>`;
        listTable.innerHTML += tr;
    });

    // 2. 전체 매칭 분석 (1, 2지망 모두 교차 검증)
    const finalMatches = document.getElementById('final-matches');
    finalMatches.innerHTML = "";
    
    const males = all.filter(p => p.gender === 'male');
    const females = all.filter(p => p.gender === 'female');
    let coupleCount = 0;

    males.forEach(man => {
        const myPicks = [man.pickId1, man.pickId2].filter(id => id !== null);
        
        females.forEach(woman => {
            const herPicks = [woman.pickId1, woman.pickId2].filter(id => id !== null);
            
            // 서로의 선택 리스트에 상대방의 번호가 있는지 확인
            if (myPicks.includes(woman.myId) && herPicks.includes(man.myId)) {
                coupleCount++;
                const div = document.createElement('div');
                div.className = "match-card";
                div.innerHTML = `
                    <strong>커플 ${coupleCount}</strong>: 
                    남${man.myId}(${man.realName}) ❤️ 여${woman.myId}(${woman.realName}) <br>
                    <small>연락처: ${man.phone} / ${woman.phone}</small>
                `;
                finalMatches.appendChild(div);
            }
        });
    });

    if(coupleCount === 0) finalMatches.innerHTML = "<p>아직 매칭된 커플이 없습니다.</p>";
}

document.getElementById('refresh-btn').addEventListener('click', loadAllData);
