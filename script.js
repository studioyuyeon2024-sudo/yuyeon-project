// 1. 데이터 (기존과 동일)
const men = [
  { id: 1, name: "남성1", pick: 3 },
  { id: 2, name: "남성2", pick: 1 },
  { id: 3, name: "남성3", pick: 5 },
  { id: 4, name: "남성4", pick: 2 },
  { id: 5, name: "남성5", pick: 8 },
  { id: 6, name: "남성6", pick: 4 },
  { id: 7, name: "남성7", pick: 7 },
  { id: 8, name: "남성8", pick: 6 }
];

const women = [
  { id: 1, name: "여성1", pick: 2 },
  { id: 2, name: "여성2", pick: 4 },
  { id: 3, name: "여성3", pick: 1 },
  { id: 4, name: "여성4", pick: 6 },
  { id: 5, name: "여성5", pick: 3 },
  { id: 6, name: "여성6", pick: 8 },
  { id: 7, name: "여성7", pick: 5 },
  { id: 8, name: "여성8", pick: 7 }
];

// 2. 화면 요소를 제어하기 위한 변수 설정
const statusMessage = document.getElementById('status-message');
const buttonArea = document.getElementById('button-area');

// 3. 매칭 결과를 담을 변수
let matchCount = 0;
let matchResultsHTML = ""; // 화면에 뿌려줄 HTML 태그를 저장할 곳

// 4. 매칭 로직 가동
men.forEach(man => {
  const selectedWoman = women.find(woman => woman.id === man.pick);

  if (selectedWoman && selectedWoman.pick === man.id) {
    matchCount++;
    // 화면에 보여줄 한 줄을 생성 (커스텀 가능)
    matchResultsHTML += `<p style="font-size: 18px; margin: 10px 0;">💖 매칭 성공! [${man.name}] ❤️ [${selectedWoman.name}]</p>`;
  }
});

// 5. 최종 결과를 화면에 반영
if (matchCount > 0) {
  statusMessage.innerText = `총 ${matchCount}쌍의 커플이 탄생했습니다! 🎉`;
  
  // 성공한 커플 리스트와 카톡 버튼 추가
  buttonArea.innerHTML = `
    <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      ${matchResultsHTML}
    </div>
    <button style="background: #FEE500; border: none; padding: 16px; border-radius: 12px; font-weight: bold; width: 100%; cursor: pointer;">
      매칭 결과 확인하고 대화하기 💬
    </button>
  `;
} else {
  statusMessage.innerText = "이번 기수에서는 인연이 안 계셨어요. 😢";
  buttonArea.innerHTML = `
    <p style="color: #666; margin-bottom: 20px;">아쉽지만 다음 기회에 더 좋은 인연을 찾아드릴게요!</p>
    <a href="#" style="color: #3498db; font-weight: bold; text-decoration: none;">
      👉 다음번 데이팅 일정 확인하기!
    </a>
  `;
}
