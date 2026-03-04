import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

document.getElementById('matching-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userData = {
    gender: document.getElementById('user-gender').value,
    myId: Number(document.getElementById('user-id').value),
    realName: document.getElementById('user-real-name').value,
    phone: document.getElementById('user-phone').value.replace(/[^0-9]/g, ""),
    pickId1: Number(document.getElementById('user-pick-1').value),
    pickId2: Number(document.getElementById('user-pick-2').value) || null, // 없으면 null
    review: document.getElementById('user-review').value,
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "participants"), userData);
    
    const querySnapshot = await getDocs(collection(db, "participants"));
    const all = [];
    querySnapshot.forEach(doc => all.push(doc.data()));

    const opposites = all.filter(p => p.gender !== userData.gender);

    // 1. 득표수 계산 (1지망이든 2지망이든 나를 찍은 사람 전체 카운트)
    const votesReceived = opposites.filter(p => p.pickId1 === userData.myId || p.pickId2 === userData.myId).length;

    // 2. 매칭 확인 (나와 서로 찍은 모든 이성을 찾음)
    const myPicks = [userData.pickId1, userData.pickId2].filter(id => id !== null);
    const matchedPartners = opposites.filter(p => {
      const theyPickedMe = (p.pickId1 === userData.myId || p.pickId2 === userData.myId);
      const iPickedThem = myPicks.includes(p.myId);
      return theyPickedMe && iPickedThem;
    });

    // 3. 화면 업데이트
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';
    document.getElementById('vote-count').innerText = votesReceived;

    const statusMsg = document.getElementById('status-message');
    const matchListArea = document.getElementById('match-list-area');
    const failBox = document.getElementById('fail-box');

    matchListArea.innerHTML = ""; // 초기화

    if (matchedPartners.length > 0) {
      statusMsg.innerText = `매칭 성공! 🎉`;
      matchedPartners.forEach(partner => {
        const div = document.createElement('div');
        div.className = "detail-box";
        div.style.display = "block";
        div.style.marginBottom = "10px";
        div.innerHTML = `💖 <strong>${partner.myId}번</strong> 상대방과 서로 마음이 통했습니다!`;
        matchListArea.appendChild(div);
      });
      failBox.style.display = 'none';
    } else {
      statusMsg.innerText = "결과 확인 완료";
      failBox.style.display = 'block';
    }

  } catch (err) {
    alert("오류 발생: " + err.message);
  }
});