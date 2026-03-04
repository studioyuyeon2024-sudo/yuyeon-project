import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
    const myGrid = document.getElementById('my-id-grid');
    const pickGrid = document.getElementById('pick-id-grid');
    const skipBtn = document.getElementById('skip-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const userIdInput = document.getElementById('user-id');
    const isSkippingInput = document.getElementById('is-skipping');
    const phoneInput = document.getElementById('user-phone');
    const privacyCheck = document.getElementById('privacy-check');

    let selectedPicks = [];

    // 버블 생성
    for (let i = 1; i <= 12; i++) {
        const mb = document.createElement('div');
        mb.className = 'bubble'; mb.innerText = i;
        mb.onclick = () => {
            document.querySelectorAll('#my-id-grid .bubble').forEach(el => el.classList.remove('selected'));
            mb.classList.add('selected'); userIdInput.value = i;
        };
        myGrid.appendChild(mb);

        const pb = document.createElement('div');
        pb.className = 'bubble pick-bubble'; pb.innerText = i;
        pb.onclick = () => {
            if (isSkippingInput.value === "true") return;
            if (selectedPicks.includes(i)) selectedPicks = selectedPicks.filter(id => id !== i);
            else if (selectedPicks.length < 2) selectedPicks.push(i);
            updatePickView();
        };
        pickGrid.appendChild(pb);
    }

    function updatePickView() {
        document.querySelectorAll('.pick-bubble').forEach(b => {
            b.classList.toggle('selected', selectedPicks.includes(parseInt(b.innerText)));
        });
    }

    // 하이픈 자동생성
    phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 3) e.target.value = val;
        else if (val.length <= 7) e.target.value = val.slice(0, 3) + '-' + val.slice(3);
        else e.target.value = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
    });

    // 제출 회수 로직
    withdrawBtn.onclick = async () => {
        const phone = phoneInput.value;
        if (phone.length < 13) return alert("번호를 정확히 입력해주세요.");
        if (!confirm("기존 제출 내역을 삭제하고 다시 작성하시겠습니까?")) return;
        try {
            const q = query(collection(db, "participants"), where("phone", "==", phone));
            const snap = await getDocs(q);
            if (snap.empty) return alert("해당 번호로 제출된 내역이 없습니다.");
            await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
            alert("회수 완료! 다시 제출해주세요.");
            withdrawBtn.style.display = 'none';
            document.getElementById('submit-btn').disabled = false;
            document.getElementById('submit-btn').innerText = "1. 정보 제출하기";
        } catch (e) { alert("오류: " + e.message); }
    };

    // 정보 제출 로직
    document.getElementById('matching-form').onsubmit = async (e) => {
        e.preventDefault();
        if (!privacyCheck.checked) return alert("개인정보 동의가 필요합니다.");
        if (!userIdInput.value) return alert("본인 번호를 선택해주세요.");
        if (phoneInput.value.length < 13) return alert("번호를 다 적어주세요.");

        const userData = {
            gender: document.getElementById('user-gender').value,
            myId: Number(userIdInput.value),
            realName: document.getElementById('user-real-name').value,
            phone: phoneInput.value,
            pickId1: selectedPicks[0] || null,
            pickId2: selectedPicks[1] || null,
            review: document.getElementById('user-review').value,
            createdAt: new Date()
        };

        try {
            const q = query(collection(db, "participants"), where("phone", "==", userData.phone));
            const snap = await getDocs(q);
            if (!snap.empty) {
                alert("이미 제출된 번호입니다. 수정하시려면 '회수하기'를 눌러주세요.");
                withdrawBtn.style.display = 'block';
                return;
            }
            await addDoc(collection(db, "participants"), userData);
            alert("제출 완료!");
            document.getElementById('submit-btn').disabled = true;
            document.getElementById('submit-btn').innerText = "✅ 제출 완료";
        } catch (e) { alert("오류: " + e.message); }
    };

    // 결과 확인 로직
    document.getElementById('check-result-btn').onclick = async () => {
        try {
            const adminDoc = await getDoc(doc(db, "settings", "matching_status"));
            if (!adminDoc.exists() || !adminDoc.data().is_open) return alert("아직 결과 공개 전입니다!");
            
            const snap = await getDocs(collection(db, "participants"));
            const all = []; snap.forEach(d => all.push(d.data()));
            const myId = Number(userIdInput.value);
            const opposites = all.filter(p => p.gender !== document.getElementById('user-gender').value);

            const votes = opposites.filter(p => p.pickId1 === myId || p.pickId2 === myId).length;
            const matched = opposites.filter(p => (p.pickId1 === myId || p.pickId2 === myId) && selectedPicks.includes(p.myId));

            document.getElementById('input-section').style.display = 'none';
            document.getElementById('result-section').style.display = 'block';
            document.getElementById('vote-count').innerText = votes;
            
            const list = document.getElementById('match-list-area');
            const statusMsg = document.getElementById('status-message');
            const failBox = document.getElementById('fail-box');
            list.innerHTML = "";

            if (matched.length > 0) {
                statusMsg.innerText = "매칭 성공! 🎉";
                matched.forEach(p => {
                    const div = document.createElement('div');
                    div.style.cssText = "background:#e3f2fd; padding:15px; border-radius:12px; margin-bottom:10px; font-weight:bold; border-left:5px solid #1A237E;";
                    div.innerHTML = `💖 ${p.myId}번 상대방과 매칭되었습니다!`;
                    list.appendChild(div);
                });
                failBox.style.display = 'none';
            } else {
                statusMsg.innerText = "분석 완료";
                failBox.style.display = 'block';
            }
        } catch (err) { alert("확인 불가: " + err.message); }
    };

    skipBtn.onclick = () => {
        const isSkip = isSkippingInput.value === "false";
        isSkippingInput.value = isSkip ? "true" : "false";
        skipBtn.classList.toggle('active', isSkip);
        if(isSkip) { selectedPicks = []; updatePickView(); }
        document.querySelectorAll('.pick-bubble').forEach(b => b.classList.toggle('disabled', isSkip));
    };
});
