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

    let selectedPicks = [];

    for (let i = 1; i <= 12; i++) {
        const mb = document.createElement('div'); mb.className = 'bubble'; mb.innerText = i;
        mb.onclick = () => { document.querySelectorAll('#my-id-grid .bubble').forEach(el => el.classList.remove('selected')); mb.classList.add('selected'); userIdInput.value = i; };
        myGrid.appendChild(mb);
        const pb = document.createElement('div'); pb.className = 'bubble pick-bubble'; pb.innerText = i;
        pb.onclick = () => { if (isSkippingInput.value === "true") return; if (selectedPicks.includes(i)) selectedPicks = selectedPicks.filter(id => id !== i); else if (selectedPicks.length < 2) selectedPicks.push(i); updatePickView(); };
        pickGrid.appendChild(pb);
    }
    function updatePickView() { document.querySelectorAll('.pick-bubble').forEach(b => b.classList.toggle('selected', selectedPicks.includes(parseInt(b.innerText)))); }

    phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 3) e.target.value = val;
        else if (val.length <= 7) e.target.value = val.slice(0, 3) + '-' + val.slice(3);
        else e.target.value = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
    });

    document.getElementById('matching-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const adminDoc = await getDoc(doc(db, "settings", "matching_status"));
            if (adminDoc.exists() && adminDoc.data().is_open) return alert("🛑 접수가 마감되었습니다.");
        } catch (err) { console.error(err); }

        if (!document.getElementById('privacy-check').checked) return alert("개인정보 동의 필수!");
        if (!userIdInput.value) return alert("본인 번호 선택!");

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
            if (!snap.empty) { alert("이미 제출된 번호입니다."); withdrawBtn.style.display = 'block'; return; }
            await addDoc(collection(db, "participants"), userData);
            alert("제출 완료!");
            document.getElementById('submit-btn').disabled = true;
        } catch (e) { alert("오류: " + e.message); }
    };

    document.getElementById('check-result-btn').onclick = async () => {
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
        const list = document.getElementById('match-list-area');
        list.innerHTML = `<div style="background:#FFF9E6; padding:20px; border-radius:20px; margin-bottom:20px;">받은 호감: <b>${votes}표</b></div>`;
        if (matched.length > 0) matched.forEach(p => list.innerHTML += `<div style='background:#e3f2fd; padding:15px; border-radius:12px; margin-bottom:10px; font-weight:bold;'>💖 ${p.myId}번(${p.realName})님과 매칭!</div>`);
        else list.innerHTML += `<div style='background:#f4f4f4; padding:20px; border-radius:15px;'>매칭되지 않았습니다.</div>`;
    };

    skipBtn.onclick = () => {
        const isSkip = isSkippingInput.value === "false";
        isSkippingInput.value = isSkip ? "true" : "false";
        skipBtn.classList.toggle('active', isSkip);
        if(isSkip) { selectedPicks = []; updatePickView(); }
        document.querySelectorAll('.pick-bubble').forEach(b => b.classList.toggle('disabled', isSkip));
    };
});
