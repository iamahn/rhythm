window.addEventListener('DOMContentLoaded', () => {
  const noteContainer = document.getElementById('noteContainer');
  const selectedNotesDiv = document.getElementById('selectedNotes');
  const clearBtn = document.getElementById('clearBtn');
  const generateBtn = document.getElementById('generateBtn'); 
  let selectedNotes = []; 

  // ─── VexFlow 전용 박자 데이터 정의 ───
// ─── VexFlow 전용 박자 데이터 정의 (HTML의 Note01 ~ Note26 완벽 대응 버전) ───
  const NOTE_DATA = {
    // 음표 (Notes)
    "Note01": { keys: ["c/5"], duration: "w", beats: 4 },      // 온음표
    "Note02": { keys: ["c/5"], duration: "h", beats: 2 },      // 2분음표
    "Note03": { keys: ["c/5"], duration: "hd", beats: 3 },     // 점2분음표 (v4: hd)
    "Note04": { keys: ["c/5"], duration: "q", beats: 1 },      // 4분음표
    "Note05": { keys: ["c/5"], duration: "qd", beats: 1.5 },    // 점4분음표 (v4: qd)
    "Note06": { keys: ["c/5"], duration: "8", beats: 0.5 },     // 8분음표
    "Note07": { keys: ["c/5"], duration: "8d", beats: 0.75 },   // 점8분음표 (v4: 8d)
    "Note08": { keys: ["c/5"], duration: "q", beats: 1 },       // 셋잇단음표 (임시 1박자 처리)
    "Note09": { keys: ["c/5"], duration: "16", beats: 0.25 },   // 16분음표
    "Note10": { keys: ["c/5"], duration: "16d", beats: 0.375 }, // 점16분음표
    "Note11": { keys: ["c/5"], duration: "32", beats: 0.125 },  // 32분음표
    "Note12": { keys: ["c/5"], duration: "q", beats: 1 },       // 16분음표 묶음 (임시 1박자)
    "Note13": { keys: ["c/5"], duration: "q", beats: 1 },       // 5연음 (임시 1박자)
    "Note14": { keys: ["c/5"], duration: "q", beats: 1 },       // 7연음 (임시 1박자)
    "Note15": { keys: ["c/5"], duration: "h", beats: 2 },       // 8분음표 4개 묶음 (2박자)
    "Note16": { keys: ["c/5"], duration: "q", beats: 1 },       // 스윙 리듬 (임시 1박자)
    "Note17": { keys: ["c/5"], duration: "q", beats: 1 },       // 슬래시 노트

    // 쉼표 (Rests - duration 뒤에 r 추가)
    "Note18": { keys: ["b/4"], duration: "wr", beats: 4 },     // 온쉼표
    "Note19": { keys: ["b/4"], duration: "hr", beats: 2 },     // 2분쉼표
    "Note20": { keys: ["b/4"], duration: "qr", beats: 1 },     // 4분쉼표
    "Note21": { keys: ["b/4"], duration: "qdr", beats: 1.5 },   // 점4분쉼표
    "Note22": { keys: ["b/4"], duration: "8r", beats: 0.5 },    // 8분쉼표
    "Note23": { keys: ["b/4"], duration: "8dr", beats: 0.75 },  // 점8분쉼표
    "Note24": { keys: ["b/4"], duration: "16r", beats: 0.25 },  // 16분쉼표
    "Note25": { keys: ["b/4"], duration: "32r", beats: 0.125 }, // 32분쉼표
    "Note26": { keys: ["b/4"], duration: "64r", beats: 0.0625 } // 64분쉼표
  };

  // 이미지 클릭 이벤트 (토글)
  if (noteContainer) {
    noteContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        const svgSrc = e.target.getAttribute('src');
        const name = e.target.getAttribute('data-name');
        const existingIndex = selectedNotes.findIndex(note => note.src === svgSrc);

        if (existingIndex === -1) {
          selectedNotes.push({ src: svgSrc, name: name });
        } else {
          selectedNotes.splice(existingIndex, 1);
        }
        updateSelectedNotes();
      }
    });
  }

  // 선택된 음표 표시
  function updateSelectedNotes() {
    if (!selectedNotesDiv) return;
    selectedNotesDiv.innerHTML = '';
    selectedNotes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'selected-note';
      div.style.display = 'inline-block';
      div.style.margin = '5px';
      const img = document.createElement('img');
      img.src = note.src;
      img.style.width = '50px';
      div.appendChild(img);
      selectedNotesDiv.appendChild(div);
    });
  }

  // 초기화 버튼
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedNotes = [];
      updateSelectedNotes();
      const resultDiv = document.getElementById('rhythmResult');
      if (resultDiv) resultDiv.innerHTML = '';
    });
  }

  // ─── 리듬 생성 로직 ───
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // 1. 브라우저 전역 객체 체크
      let VF = null;
      if (typeof Vex !== 'undefined' && Vex.Flow) {
        VF = Vex.Flow;
      } else if (typeof VexFlow !== 'undefined') {
        VF = VexFlow;
      }

      if (!VF) {
        alert('VexFlow 라이브러리가 로드되지 않았습니다.');
        return;
      }

      const { Renderer, Stave, StaveNote, Formatter, Voice } = VF;	

      if (selectedNotes.length === 0) {
        alert('먼저 리듬에 사용할 음표를 선택해주세요!');
        return;
      }

      // 2. 사전에 등록된 유효 음표 필터링
      const validNotes = selectedNotes.filter(n => NOTE_DATA[n.name]);
      if (validNotes.length === 0) {
        alert('선택하신 음표 중 사용 가능한 기본 음표(온/2/4/8/16분 음표)가 없습니다. 다른 음표를 골라주세요!');
        return;
      }

      // 3. 렌더 영역 초기 세팅
      let resultDiv = document.getElementById('rhythmResult');
      if (!resultDiv) {
        resultDiv = document.createElement('div');
        resultDiv.id = 'rhythmResult';
        document.body.appendChild(resultDiv);
      }
      resultDiv.innerHTML = '<h3>생성된 스네어 리듬 (VexFlow):</h3>';
      
      const scoreDiv = document.createElement('div');
      scoreDiv.style.padding = '20px';
      scoreDiv.style.backgroundColor = '#fff';
      scoreDiv.style.marginTop = '10px';
      resultDiv.appendChild(scoreDiv);

      const renderer = new Renderer(scoreDiv, Renderer.Backends.SVG);
      renderer.resize(920, 150);
      const context = renderer.getContext();

      const totalMeasures = 4;
      const beatsPerMeasure = 4;
      const allMeasuresNotes = [];

      // [단계 1] 무작위 4마디 리듬 배열 구성
      for (let m = 1; m <= totalMeasures; m++) {
        let currentBeat = 0;
        const measureNotes = [];
        let safetyCounter = 0;

        while (currentBeat < beatsPerMeasure && safetyCounter < 300) {
          safetyCounter++;
          
          const randomSelected = validNotes[Math.floor(Math.random() * validNotes.length)];
          const info = NOTE_DATA[randomSelected.name];

          if (currentBeat + info.beats <= beatsPerMeasure) {
            currentBeat += info.beats;
            
            // 단선 악보를 위한 필수 매개변수 주입 (clef, stem_direction)
            const isRest = info.duration.includes('r');
            const staveNote = new StaveNote({
              keys: [isRest ? "b/4" : "c/5"], 
              duration: info.duration,
              clef: "percussion",
              stem_direction: 1
            });
            measureNotes.push(staveNote);
          } 
          
          // 남은 자투리 박자 자동 쉼표 채움 방어 로직
          const remaining = beatsPerMeasure - currentBeat;
          if (remaining > 0) {
            const canFillMore = validNotes.some(n => NOTE_DATA[n.name].beats <= remaining);
            if (!canFillMore) {
              if (remaining >= 2) {
                measureNotes.push(new StaveNote({ keys: ["b/4"], duration: "hr", clef: "percussion" }));
                currentBeat += 2;
              } else if (remaining >= 1) {
                measureNotes.push(new StaveNote({ keys: ["b/4"], duration: "qr", clef: "percussion" }));
                currentBeat += 1;
              } else if (remaining >= 0.5) {
                measureNotes.push(new StaveNote({ keys: ["b/4"], duration: "8r", clef: "percussion" }));
                currentBeat += 0.5;
              } else {
                measureNotes.push(new StaveNote({ keys: ["b/4"], duration: "16r", clef: "percussion" }));
                currentBeat += 0.25;
              }
            }
          }
        }
        allMeasuresNotes.push(measureNotes);
      }

      // [단계 2] 4개의 마디(Stave) 가로 배치 (단선 악보 전용 옵션)
      const startX = 20;
      const totalWidth = 880; 
      const firstMeasureWidth = 260; 
      const remainWidth = (totalWidth - firstMeasureWidth) / 3; 

      const staves = [];
      
      const stave1 = new Stave(startX, 20, firstMeasureWidth, { num_lines: 1 });
      stave1.addClef('percussion'); 
      stave1.addTimeSignature('4/4');
      staves.push(stave1);

      let currentX = startX + firstMeasureWidth;
      for (let i = 1; i < totalMeasures; i++) {
        const stave = new Stave(currentX, 20, remainWidth, { num_lines: 1 });
        if (i === totalMeasures - 1) {
          stave.setEndBarline(2); 
        }
        staves.push(stave);
        currentX += remainWidth;
      }

      // [단계 3] 렌더 컨텍스트 연결 및 최종 출력
      const formatter = new Formatter();

      for (let i = 0; i < totalMeasures; i++) {
        staves[i].setContext(context).draw();

        if (allMeasuresNotes[i].length > 0) {
          const voice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT);
          voice.addTickables(allMeasuresNotes[i]);

          formatter.formatToStave([voice], staves[i]);
          voice.draw(context, staves[i]);
        }
      }
    });
  }
});
