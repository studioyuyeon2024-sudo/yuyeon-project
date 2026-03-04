// 남성 참가자 리스트 (8명)
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

// 여성 참가자 리스트 (8명)
const women = [
  { id: 1, name: "여성1", pick: 2 },
  { id: 2, name: "여성2", pick: 4 },
  { id: 3, name: "여성3", pick: 1 }, // 남성 1번과 서로 선택!
  { id: 4, name: "여성4", pick: 6 }, // 남성 6번과 서로 선택!
  { id: 5, name: "여성5", pick: 3 }, // 남성 3번과 서로 선택!
  { id: 6, name: "여성6", pick: 8 }, // 남성 8번과 서로 선택!
  { id: 7, name: "여성7", pick: 5 },
  { id: 8, name: "여성8", pick: 7 }
];
console.log("=== 매칭 결과 리포트 ===");

let matchCount = 0;

// 남성 리스트를 한 명씩 확인
men.forEach(man => {
  // 1. 남성이 선택한 번호(man.pick)와 일치하는 여성을 찾음
  const selectedWoman = women.find(woman => woman.id === man.pick);

  // 2. 그 여성이 선택한 번호(selectedWoman.pick)가 남성의 번호(man.id)와 같은지 확인
  if (selectedWoman && selectedWoman.pick === man.id) {
    matchCount++;
    console.log(`💖 매칭 성공! [${man.name}] ❤️ [${selectedWoman.name}]`);
  }
});

if (matchCount === 0) {
  console.log("아쉽게도 매칭된 커플이 없습니다. 😢");
} else {
  console.log(`총 ${matchCount}쌍의 커플이 탄생했습니다! 🎉`);
}