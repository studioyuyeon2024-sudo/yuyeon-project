import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    const userIdInput = document.getElementById('user-id');
    const isSkippingInput = document.getElementById('is-skipping');
    const phoneInput = document.getElementById('user-phone');
    const privacyCheck = document.getElementById('privacy-check'); // 개인정보 체크박스 추가

    let selectedPicks = [];

    // [1] 버블 생성 (본인 번호 & 이성 번호)
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

    // [2] 다음 인연 버튼 (Skip) 로직
    skipBtn.onclick = () => {
        const isSkip = isSkippingInput.value === "false";
        isSkippingInput.value = isSkip ? "true" : "false";
        skipBtn.classList.toggle('active', isSkip);
        if(isSkip) { 
            selectedPicks = []; 
            updatePickView(); 
            skipBtn.innerText = "선택 완료: 다음 기수 기대하기 ✨";
        } else {
            skipBtn.innerText = "이번 기수에는 인연이 없었어요 ❄️";
        }
        document.querySelectorAll('.pick-bubble').forEach(b => b.classList.toggle('disabled', isSkip));
    };

    // [3] 하이픈 자동 생성 및 숫자만 입력 로직
    phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 3) e.target.value = val;
        else if (val.length <= 7) e.target.value = val.slice(0, 3) + '-' + val.slice(3);
        else e.target.value = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
    });

    // [4] 정보 제출하기 (데이터 저장)
    document.getElementById('matching-form').onsubmit = async (e) => {
        e.preventDefault();

        // --- 유효성 검사 시작 ---
        // 개인정보 동의 여부 확인
        if (!privacyCheck.checked) {
            return alert("개인정보 수집 및 이용에 동의해 주셔야 제출이 가능합니다. ✅");
        }

        if(!userIdInput.value) return alert("본인의 번호를 선택해주세요.");
        if(phoneInput.value.length < 13) return alert("핸드폰 번호를 다 적어주세요.");
        
        if(isSkippingInput.value === "false" && selectedPicks.length === 0) {
            return alert("호감 가는 이성 번호를 선택하거나 '이번에는 인연이 없었어요' 버튼을 눌러주세요.");
        }
        // --- 유효성 검사 끝 ---

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
            await addDoc(collection(db, "participants"), userData);
            alert("제출 완료! 관리자 승인 후 결과를 확인하실 수 있습니다.");
            document.getElementById('submit-btn').innerText = "✅ 정보 제출 완료";
            document.getElementById('submit-btn').disabled = true;
        } catch (err) { 
            console.error(err);
            alert("제출 중 오류가 발생했습니다: " + err.message); 
        }
    };

    // [5] 결과 확인하기 (승인 여부 체크 후 실행)
    document.getElementById('check-result-btn').onclick = async () => {
        try {
            const adminDoc = await getDoc(doc(db, "settings", "matching_status"));
            if (!adminDoc.exists() || !adminDoc.data().is_open) {
                return alert("아직 결과 공개 전입니다. 잠시만 기다려주세요! 😊");
            }
            
            // 승인되었다면 매칭 분석 시작
            startMatching();
        } catch (err) { 
            console.error(err);
            alert("확인 불가: " + err.message); 
        }
    };

    // [6] 최종 매칭 판독 로직
    async function startMatching() {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const all = [];
        querySnapshot.forEach(doc => all.push(doc.data()));
        
        const myId = Number(userIdInput.value);
        const myGender = document.getElementById('user-gender').value;
        const opposites = all.filter(p => p.gender !== myGender);

        // 내가 받은 득표수
        const votes = opposites.filter(p => p.pickId1 === myId || p.pickId2 === myId).length;
        
        // 서로 매칭된 사람 찾기
        const matched = opposites.filter(p => 
            (p.pickId1 === myId || p.pickId2 === myId) && selectedPicks.includes(p.myId)
        );

        // 화면 전환
        document.getElementById('input-section').style.display = 'none';
        document.getElementById('result-section').style.display = 'block';
        document.getElementById('vote-count').innerText = votes;

        const matchList = document.getElementById('match-list-area');
        matchList.innerHTML = ""; // 초기화

        if (matched.length > 0) {
            document.getElementById('status-message').innerText = "매칭 성공! 🎉";
            matched.forEach(p => {
                const div = document.createElement('div');
                div.style.cssText = "background: #e3f2fd; padding: 15px; border-radius: 12px; margin-bottom: 10px; font-weight: bold; border-left: 5px solid #1A237E; text-align: left;";
                div.innerHTML = `💖 ${p.myId}번 상대방과 마음이 통했습니다!`;
                matchList.appendChild(div);
            });
        } else {
            document.getElementById('status-message').innerText = "분석 완료";
            document.getElementById('fail-box').style.display = 'block';
        }
    }
});
