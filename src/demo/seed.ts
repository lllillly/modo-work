export const businessesCsv = `name,order,active
사업 1,1,Y
사업 2,2,Y`

export const areasCsv = `code,name,order,can_view_other_areas,active,delegation_enabled
area1,영역 1,1,Y,Y,Y
area2,영역 2,2,Y,Y,N
area3,영역 3,3,N,Y,Y`

export const orgUnitsCsv = `name,order,active,public
조직 단위 1,1,Y,N
조직 단위 2,2,Y,N
조직 단위 3,3,Y,N
조직 단위 4 (종료),4,Y,Y`

export const usersCsv = `email,name,status,org_unit,areas
admin01@example.com,여도담,활성,,
lead01@example.com,엄하늘,활성,조직 단위 1,
lead02@example.com,안새봄,활성,조직 단위 2,
lead03@example.com,신보람,활성,조직 단위 3,
viewer01@example.com,손지안,활성,,
user01@example.com,강가온,활성,조직 단위 1,영역 1
user02@example.com,고나래,활성,조직 단위 1,영역 1
user03@example.com,구다온,활성,조직 단위 2,영역 1
user04@example.com,권라온,활성,조직 단위 2,영역 1
user05@example.com,남마루,활성,조직 단위 3,영역 1
user06@example.com,노바다,활성,조직 단위 3,영역 1
user07@example.com,도사랑,활성,조직 단위 1,영역 2
user08@example.com,류아라,활성,조직 단위 2,영역 2
user09@example.com,문자람,활성,조직 단위 1,영역 3
user10@example.com,민차오,활성,조직 단위 2,영역 3
user11@example.com,배하람,활성,조직 단위 3,영역 3
user12@example.com,변누리,활성,조직 단위 3,영역 3
user13@example.com,서이든,활성,조직 단위 1,영역 1;영역 3
user14@example.com,손지안,비활성,조직 단위 2,영역 1
new01@example.com,서이든,승인 대기,,
new02@example.com,배하람,승인 대기,,`

export const userRolesCsv = `email,role,scope_type,scope_value
admin01@example.com,관리자,전체,
lead01@example.com,리더,조직 단위,조직 단위 1
lead01@example.com,리더,영역,영역 2
lead02@example.com,리더,조직 단위,조직 단위 2
lead03@example.com,리더,조직 단위,조직 단위 3
viewer01@example.com,열람 전용,전체,
user01@example.com,담당자,,
user02@example.com,담당자,,
user03@example.com,담당자,,
user04@example.com,담당자,,
user05@example.com,담당자,,
user06@example.com,담당자,,
user07@example.com,담당자,,
user08@example.com,담당자,,
user09@example.com,담당자,,
user10@example.com,담당자,,
user11@example.com,담당자,,
user12@example.com,담당자,,
user13@example.com,담당자,,
user14@example.com,담당자,,`

export const coursesCsv = `external_key,business,name,start_date,end_date,capacity,length_type,org_unit,assignee_area1,assignee_area2,assignee_area3
C-0001~3,사업 1,예시 과정 A 3회차,2026-06-15,2026-12-11,30,장기,조직 단위 1,user01@example.com,user07@example.com,user09@example.com
C-0002~5,사업 1,예시 과정 B 5회차,2026-08-03,2027-01-29,25,장기,조직 단위 1,user02@example.com,user07@example.com,user09@example.com
C-0003~2,사업 1,예시 과정 C 2회차,2026-09-21,2027-03-19,30,장기,조직 단위 2,user03@example.com,user07@example.com,user10@example.com
C-0004~1,사업 2,예시 과정 D 1회차,2026-09-01,2026-11-13,20,단기,조직 단위 2,user04@example.com,user08@example.com,user10@example.com
C-0005~2,사업 2,예시 과정 E 2회차,2026-10-12,2026-12-23,20,단기,조직 단위 2,user14@example.com,user08@example.com,user10@example.com
C-0006~4,사업 1,예시 과정 F 4회차,2026-10-22,2027-01-15,25,단기,조직 단위 3,user05@example.com,user07@example.com,user11@example.com
C-0007~1,사업 1,예시 과정 G 1회차,2026-11-30,2027-05-28,30,장기,조직 단위 3,user06@example.com,user08@example.com,user11@example.com;user12@example.com
C-0001~4,사업 1,예시 과정 A 4회차,2026-12-14,2027-06-11,30,장기,조직 단위 1,user01@example.com,user07@example.com,user09@example.com
C-0008~1,사업 2,예시 과정 H 1회차,2026-12-15,2027-02-20,25,단기,조직 단위 2,user03@example.com;user04@example.com,user08@example.com,
C-0009~3,사업 2,예시 과정 I 3회차,2026-11-16,2027-01-22,20,단기,조직 단위 1,user13@example.com,user07@example.com,user13@example.com
C-0010~1,사업 1,예시 과정 J 1회차,2027-01-04,2027-06-25,40,장기,조직 단위 3,user05@example.com,user08@example.com,user12@example.com
C-0011~2,사업 1,예시 과정 K 2회차,2027-01-31,2027-07-30,30,장기,조직 단위 2,user04@example.com,user07@example.com,user10@example.com
C-0012~1,사업 2,예시 과정 L 1회차,2027-02-08,2027-04-16,15,단기,조직 단위 3,user06@example.com,user08@example.com,user11@example.com
C-0013~6,사업 1,예시 과정 M 6회차,2027-03-02,2027-08-27,30,장기,조직 단위 1,user02@example.com,user07@example.com,user09@example.com
C-0014~1,사업 2,예시 과정 N 1회차,2027-03-15,2027-05-21,20,단기,조직 단위 2,user03@example.com,user08@example.com,user10@example.com
C-0015~2,사업 1,예시 과정 O 2회차,2027-04-05,2027-09-24,30,장기,조직 단위 3,user06@example.com,user07@example.com,user12@example.com
C-0016~1,사업 2,예시 과정 P 1회차,2027-05-17,2027-07-23,20,단기,조직 단위 1,user01@example.com,user08@example.com,user09@example.com
C-0017~1,사업 1,예시 과정 Q 1회차,2026-03-03,2026-08-28,30,장기,조직 단위 4 (종료),user02@example.com,user07@example.com,user09@example.com
C-0018~2,사업 2,예시 과정 R 2회차,2026-05-11,2026-07-17,20,단기,조직 단위 4 (종료),user04@example.com,user08@example.com,user10@example.com
C-0019~1,사업 2,예시 과정 S 1회차,2026-11-23,2027-01-29,20,단기,조직 단위 3,nobody@example.com,user08@example.com,user11@example.com`

export const templatesCsv = `business,template_key,name,stage,area,tags,base,offset,offset_long,offset_short,performer,system,linked_doc,review_required
사업 1,T1-01,참여자 모집 공고 게시,준비,영역 1,모집,시작일,-42,-56,-35,담당자,시스템 A,운영 업무 안내서 (예시),N
사업 1,T1-02,선발 결과 정리,준비,영역 1,모집,시작일,-7,,,담당자,시스템 A,,Y
사업 1,T1-03,시설과 장비 점검,준비,영역 1,시설,시작일,-5,,,담당자,,,N
사업 1,T1-04,개강 안내 발송,준비,영역 1,안내,시작일,-3,,,담당자,시스템 A,운영 업무 안내서 (예시),N
사업 1,T1-05,참여자 명단 등록,준비,영역 2,행정,시작일,2,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 1,T1-06,월간 출석 확인,진행,영역 2,출석;월간,월주기종료일,3,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 1,T1-07,월간 비용 정산 자료 제출,진행,영역 2,정산;월간,월주기종료일,7,,,담당자,시스템 C,운영 업무 안내서 (예시),Y
사업 1,T1-08,월간 진행 점검 메모,진행,영역 1,점검;월간,월주기종료일,0,,,담당자,,,N
사업 1,T1-09,이탈 위험 참여자 점검,진행,영역 1,점검,시작일,14,,,담당자,,,Y
사업 1,T1-10,중간 만족도 조사,진행,영역 1,설문,시작일,45,60,30,담당자,시스템 A,,N
사업 1,T1-11,종료 안내 발송,종료,영역 1,안내,종료일,-10,,,담당자,시스템 A,,N
사업 1,T1-12,종료 만족도 조사,종료,영역 1,설문,종료일,-3,,,담당자,시스템 A,,N
사업 1,T1-13,수료 결과 보고,종료,영역 2,행정;보고,종료일,5,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 1,T1-14,증빙 자료 보관,종료,영역 2,행정,종료일,14,,,담당자,,운영 업무 안내서 (예시),Y
사업 1,T1-15,사후 연락 1차,사후,영역 3,사후관리,종료일,30,,,담당자,,,N
사업 1,T1-16,사후 결과 집계,사후,영역 3,사후관리;보고,종료일,90,90,60,담당자,시스템 C,운영 업무 안내서 (예시),Y
사업 1,T1-17,주간 공지 확인,상시,영역 1,상시,상시,,,,담당자,,,N
사업 1,T1-18,문의함 확인,상시,영역 3,상시,상시,,,,담당자,,,N
사업 2,T2-01,신청 접수 시작 안내,준비,영역 1,모집,시작일,-21,,,담당자,시스템 A,,N
사업 2,T2-02,참여자 확정,준비,영역 1,모집,시작일,-2,,,담당자,시스템 A,,Y
사업 2,T2-03,참여자 명단 등록,준비,영역 2,행정,시작일,1,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 2,T2-04,월간 출석 확인,진행,영역 2,출석;월간,월주기종료일,2,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 2,T2-05,월간 비용 정산 자료 제출,진행,영역 2,정산;월간,월주기종료일,5,,,담당자,시스템 C,운영 업무 안내서 (예시),Y
사업 2,T2-06,중간 점검 회의록,진행,영역 1,점검,시작일,21,,,리더,,,N
사업 2,T2-07,종료 만족도 조사,종료,영역 1,설문,종료일,-2,,,담당자,시스템 A,,N
사업 2,T2-08,수료 결과 보고,종료,영역 2,행정;보고,종료일,3,,,담당자,시스템 B,운영 업무 안내서 (예시),Y
사업 2,T2-09,사후 연락,사후,영역 3,사후관리,종료일,14,,,담당자,,,N
사업 2,T2-10,사후 결과 집계,사후,영역 3,사후관리;보고,종료일,45,,,담당자,시스템 C,운영 업무 안내서 (예시),Y`

export const holidaysCsv = `date,name,source
2026-01-01,신정,API
2026-02-16,설날 연휴,API
2026-02-17,설날,API
2026-02-18,설날 연휴,API
2026-03-01,삼일절,API
2026-03-02,대체공휴일(삼일절),API
2026-05-05,어린이날,API
2026-05-24,부처님오신날,API
2026-05-25,대체공휴일(부처님오신날),API
2026-06-03,전국동시지방선거,API
2026-06-06,현충일,API
2026-08-15,광복절,API
2026-08-17,대체공휴일(광복절),API
2026-09-24,추석 연휴,API
2026-09-25,추석,API
2026-09-26,추석 연휴,API
2026-10-03,개천절,API
2026-10-05,대체공휴일(개천절),API
2026-10-09,한글날,API
2026-12-25,성탄절,API
2027-01-01,신정,API
2027-02-05,설날 연휴,API
2027-02-06,설날,API
2027-02-07,설날 연휴,API
2027-02-08,대체공휴일(설날),API
2027-03-01,삼일절,API
2027-04-02,회사 휴무일(예시),수동
2027-05-05,어린이날,API
2027-05-13,부처님오신날,API
2027-06-06,현충일,API
2027-08-15,광복절,API
2027-08-16,대체공휴일(광복절),API
2027-09-14,추석 연휴,API
2027-09-15,추석,API
2027-09-16,추석 연휴,API
2027-10-03,개천절,API
2027-10-04,대체공휴일(개천절),API
2027-10-09,한글날,API
2027-10-11,대체공휴일(한글날),API
2027-12-25,성탄절,API
2027-12-27,대체공휴일(성탄절),API`

export const documentsCsv = `title,doc_type,business,effective_date,file,url
사내 생활 안내서 (예시),안내서,,2026-09-01,사내생활안내서_예시.pdf,
출장 및 경비 처리 기준 (예시),규정,,2026-07-01,출장경비기준_예시.pdf,
정보 보안 수칙 (예시),규정,,2026-03-01,정보보안수칙_예시.pdf,
운영 업무 안내서 (예시),업무 안내,사업 1;사업 2,2026-10-01,운영업무안내서_예시.pdf,
외부 참고 링크 (예시),외부 링크,사업 1,2026-10-01,,https://example.com/guide`

export const intentsCsv = `intent_key,name,business,target_type,target
annual_leave,연차 신청,,QA,QA-01
sick_leave,병가와 갑작스러운 결근,,QA,QA-02
supplies,비품 신청,,QA,QA-03
parcel,택배와 우편,,QA,QA-04
meeting_room,회의실 예약,,QA,QA-05
remote_work,재택근무,,QA,QA-06
family_event,경조사,,QA,QA-07
education_support,교육비 지원,,QA,QA-08
business_trip,출장 신청,,QA,QA-09
expense,경비 정산과 법인카드,,QA,QA-10
password,비밀번호와 계정,,QA,QA-11
wifi,와이파이,,QA,QA-12
parking,주차,,QA,QA-13
privacy,개인정보 다루기,,DOC,정보 보안 수칙 (예시)
my_tasks,내 할 일 보기,,SCREEN,/my-tasks
due_rule,마감일 당김 규칙,,DOC,운영 업무 안내서 (예시)`

export const intentExamplesCsv = `intent_key,example
annual_leave,연차 어떻게 신청해요
annual_leave,휴가 쓰려면 어디서 신청하나요
annual_leave,연차 며칠 전에 올려야 돼요
annual_leave,반차도 쓸 수 있나요
annual_leave,다음 주 금요일 쉬고 싶은데 절차가 뭐예요
annual_leave,휴가 승인은 누가 해요
annual_leave,연차 신청 마감이 있나요
annual_leave,오후 반차 신청 방법
sick_leave,아파서 오늘 못 나갈 것 같아요
sick_leave,병가는 어떻게 처리해요
sick_leave,갑자기 몸이 안 좋을 때 연락은 누구한테
sick_leave,병가 쓰면 진단서 필요해요
sick_leave,당일에 결근하게 되면 어떻게 해요
sick_leave,독감 걸렸는데 며칠 쉬어도 되나요
sick_leave,병원 가야 해서 늦을 것 같아요
sick_leave,병가 신청 기한
supplies,모니터 하나 더 받을 수 있나요
supplies,비품 신청은 어디서 해요
supplies,볼펜이랑 노트 필요해요
supplies,키보드가 고장났어요 새로 받으려면
supplies,사무용품 신청 마감일
supplies,비품 언제 나와요
supplies,비싼 장비도 신청 가능한가요
supplies,마우스 교체 요청
parcel,택배 어디로 와요
parcel,회사로 개인 택배 받아도 되나요
parcel,택배 보관함 위치
parcel,우편물은 누가 받아줘요
parcel,택배가 왔다는데 못 찾겠어요
parcel,택배 며칠 보관해줘요
parcel,반품 택배 보내려면
parcel,등기 우편 받는 곳
meeting_room,회의실 예약하려면
meeting_room,회의실 몇 시간까지 잡을 수 있어요
meeting_room,회의실 예약 취소는
meeting_room,큰 회의실 있나요
meeting_room,예약해 놓고 안 쓰면 어떻게 돼요
meeting_room,회의실 화상장비 사용법
meeting_room,회의실 비어 있는지 확인하는 법
meeting_room,오늘 오후 회의실 잡고 싶어요
remote_work,재택 신청 어떻게 해요
remote_work,재택근무 일주일에 몇 번 돼요
remote_work,재택할 때 근무 시간 규칙
remote_work,재택 전날까지 신청해야 해요
remote_work,집에서 일해도 되는 날
remote_work,재택 중 회의 참석은
remote_work,재택 신청 마감 시간
remote_work,코어타임이 뭐예요
family_event,결혼하면 휴가 며칠이에요
family_event,경조사 지원 신청
family_event,조의금 지원 받을 수 있나요
family_event,부모님 칠순도 경조사인가요
family_event,경조 휴가 신청 방법
family_event,경조금 얼마 나와요
family_event,경조사 신청 기한
family_event,출산 축하금 있나요
education_support,외부 강의 들으면 지원돼요
education_support,교육비 지원 한도
education_support,자격증 시험비도 지원해요
education_support,온라인 강의 수강료 환급
education_support,교육비 신청은 언제 해요
education_support,책 사는 것도 지원되나요
education_support,교육 지원 받고 나서 제출할 것
education_support,세미나 참가비 지원
business_trip,출장 가려면 뭐부터 해요
business_trip,출장 신청 며칠 전에 해야 돼요
business_trip,지방 출장 숙박 지원
business_trip,출장 일비 있어요
business_trip,해외 출장 절차
business_trip,출장 승인 받는 법
business_trip,당일치기 출장도 신청해요
business_trip,출장 숙소 금액 상한
expense,영수증 정산은 어떻게 해요
expense,법인카드 쓰고 나서 할 일
expense,출장비 정산 기한
expense,식대 한도가 얼마예요
expense,개인 카드로 결제했는데 돌려받으려면
expense,법인카드 사용 내역 등록
expense,영수증 잃어버렸어요
expense,택시비 정산
password,비밀번호 바꿔야 한대요
password,비밀번호 몇 자리 이상
password,계정이 잠겼어요
password,비밀번호 잊어버렸어요
password,비밀번호 변경 주기
password,2단계 인증 설정
password,로그인이 안 돼요
password,계정 잠금 풀어주세요
wifi,와이파이 비번 뭐예요
wifi,손님용 와이파이
wifi,인터넷이 안 돼요
wifi,회사 와이파이 이름
wifi,노트북 무선 연결
wifi,게스트 와이파이 비밀번호 어디서 알아요
wifi,와이파이가 자꾸 끊겨요
wifi,개인 휴대폰 와이파이 연결
parking,주차 되나요
parking,방문객 주차 몇 시간 무료
parking,직원 정기 주차 신청
parking,주차 등록은 어디서
parking,차 가져가도 돼요
parking,주차비 지원
parking,외부 손님 주차 등록
parking,월 주차 신청 마감
privacy,참여자 명단 파일 밖으로 보내도 돼요
privacy,개인정보 들어간 파일 어떻게 보관
privacy,주민번호를 메신저로 보내도 되나요
privacy,개인정보 파일 암호
privacy,명단 출력해도 되나요
privacy,개인정보 실수로 보냈어요
privacy,외부에 자료 공유할 때 주의
privacy,개인정보 보관 기간
my_tasks,내 할 일 어디서 봐요
my_tasks,오늘 해야 할 일 목록
my_tasks,마감 지난 일 보여줘
my_tasks,이번 주 할 일
my_tasks,내가 맡은 과정 할 일
my_tasks,기한 지난 거 있나
my_tasks,다음 마감 뭐예요
my_tasks,할 일 목록 열어줘
due_rule,마감일이 왜 하루 당겨졌어요
due_rule,마감이 주말이면 어떻게 돼요
due_rule,공휴일에 마감이면
due_rule,마감일 계산 기준
due_rule,원래 날짜랑 마감이 달라요
due_rule,영업일 기준이 뭐예요
due_rule,월 단위 주기는 어떻게 세요
due_rule,과정 종료일 바뀌면 마감도 바뀌어요`

export const qaCsv = `qa_key,business,question,answer,source_doc,source_page
QA-01,사업 1;사업 2,연차는 어떻게 신청하나요?,사용일 3영업일 전까지 근태 시스템(시스템 D)에서 신청하고 리더가 승인합니다. 반차는 4시간 단위입니다.,사내 생활 안내서 (예시),1
QA-02,,아파서 출근이 어려우면 어떻게 하나요?,"당일 오전 10시 전까지 리더에게 메신저로 알리고, 출근 후 근태 시스템에 병가로 등록합니다. 3일 이상이면 진단서를 냅니다.",사내 생활 안내서 (예시),1
QA-03,,비품은 어떻게 신청하나요?,매주 수요일 18시까지 비품 신청서를 내면 다음 주 월요일에 받습니다. 5만원 이상 물품은 리더 승인이 필요합니다.,사내 생활 안내서 (예시),2
QA-04,,택배는 어디서 찾나요?,"1층 택배 보관함에 놓입니다. 개인 택배는 3일 보관하며, 회사 우편물은 안내 데스크가 받습니다.",사내 생활 안내서 (예시),2
QA-05,,회의실은 어떻게 예약하나요?,사내 캘린더에서 예약하며 한 번에 최대 2시간입니다. 시작 10분이 지나도 체크인이 없으면 자동 취소됩니다.,사내 생활 안내서 (예시),3
QA-06,,재택근무 규칙은?,"주 2회까지, 전날 18시까지 등록합니다. 10시부터 16시까지는 메신저 접속을 유지합니다(코어타임).",사내 생활 안내서 (예시),4
QA-07,,경조사 지원은 어떻게 받나요?,"본인 결혼 휴가 5일, 직계가족 장례 휴가 3일이며 경조금은 기준표를 따릅니다. 경조일로부터 30일 안에 신청합니다.",사내 생활 안내서 (예시),5
QA-08,,교육비 지원 한도는?,"1인 연 100만원까지이며, 수강 전에 신청하고 수료증과 영수증을 내면 지급합니다.",사내 생활 안내서 (예시),6
QA-09,,출장은 언제까지 신청하나요?,"출발 3영업일 전까지 출장 신청서를 올립니다. 일비는 하루 2만원, 숙박은 1박 10만원까지입니다.",출장 및 경비 처리 기준 (예시),1
QA-10,,법인카드를 쓴 뒤 할 일은?,사용일로부터 7일 안에 경비 시스템에 사용 내역과 영수증을 등록합니다. 식대는 1인 1만2천원이 상한입니다.,출장 및 경비 처리 기준 (예시),2
QA-10b,,개인 카드로 낸 비용은 어떻게 돌려받나요?,영수증을 30일 안에 경비 시스템에 올리면 다음 달 급여일에 함께 지급합니다. 영수증을 잃어버렸으면 카드 사용 내역과 사유서를 냅니다.,출장 및 경비 처리 기준 (예시),3
QA-11,,비밀번호 규칙은?,"12자 이상, 90일마다 바꿉니다. 5번 틀리면 계정이 잠기며 보안 담당에게 잠금 해제를 요청합니다.",정보 보안 수칙 (예시),1
QA-12,,와이파이 이름과 비밀번호는?,"직원용은 OFFICE-STAFF(회사 계정으로 로그인), 손님용은 OFFICE-GUEST이며 손님용 비밀번호는 매일 바뀌어 안내 데스크에서 알려줍니다.",정보 보안 수칙 (예시),2
QA-13,,주차는 어떻게 하나요?,방문객은 안내 데스크 등록 시 2시간 무료입니다. 직원 정기 주차는 매월 20일까지 다음 달분을 신청합니다.,사내 생활 안내서 (예시),6`

export const completionLogsCsv = `external_key,template_key,cycle_no,action,actor,on_behalf_of,at,memo
C-0001~3,T1-01,0,완료,user01@example.com,,2026-04-20T11:52:00+09:00,자료 첨부함
C-0001~3,T1-02,0,완료,user01@example.com,,2026-06-06T14:21:00+09:00,리더와 통화 후 처리
C-0001~3,T1-04,0,완료,user01@example.com,,2026-06-11T09:13:00+09:00,누락 1건 보완 후 완료
C-0001~3,T1-06,1,완료,user07@example.com,,2026-07-15T15:57:00+09:00,누락 1건 보완 후 완료
C-0001~3,T1-06,2,완료,user07@example.com,,2026-08-13T13:04:00+09:00,
C-0001~3,T1-06,2,확인,lead01@example.com,,2026-08-14T14:04:00+09:00,
C-0001~3,T1-06,3,완료,user07@example.com,,2026-09-15T14:29:00+09:00,처리 완료
C-0001~3,T1-06,3,확인,lead01@example.com,,2026-09-16T15:29:00+09:00,
C-0001~3,T1-06,4,완료,user07@example.com,,2026-10-16T16:44:00+09:00,처리 완료
C-0001~3,T1-07,1,완료,user07@example.com,,2026-07-21T15:19:00+09:00,처리 완료
C-0001~3,T1-07,3,완료,user07@example.com,,2026-09-19T11:25:00+09:00,리더와 통화 후 처리
C-0001~3,T1-07,4,완료,user07@example.com,,2026-10-21T14:46:00+09:00,리더와 통화 후 처리
C-0001~3,T1-07,4,확인,lead01@example.com,,2026-10-23T15:46:00+09:00,
C-0001~3,T1-08,1,완료,user01@example.com,,2026-07-14T15:05:00+09:00,리더와 통화 후 처리
C-0001~3,T1-08,2,완료,user01@example.com,,2026-08-14T13:36:00+09:00,처리 완료
C-0001~3,T1-08,3,완료,user01@example.com,,2026-09-14T10:56:00+09:00,
C-0001~3,T1-09,0,완료,user01@example.com,,2026-06-29T16:22:00+09:00,처리 완료
C-0001~3,T1-09,0,확인,lead01@example.com,,2026-07-01T17:22:00+09:00,
C-0001~3,T1-10,0,완료,user01@example.com,,2026-08-13T16:52:00+09:00,전원 확인
C-0002~5,T1-01,0,완료,user02@example.com,,2026-06-07T15:28:00+09:00,
C-0002~5,T1-03,0,완료,user02@example.com,,2026-07-29T11:20:00+09:00,자료 첨부함
C-0002~5,T1-04,0,완료,user02@example.com,,2026-07-29T14:45:00+09:00,누락 1건 보완 후 완료
C-0002~5,T1-06,1,완료,user07@example.com,,2026-09-03T17:48:00+09:00,
C-0002~5,T1-06,2,완료,user07@example.com,,2026-09-30T17:26:00+09:00,
C-0002~5,T1-06,2,확인,lead01@example.com,,2026-10-01T18:26:00+09:00,
C-0002~5,T1-07,2,완료,user07@example.com,,2026-10-07T16:05:00+09:00,
C-0002~5,T1-07,2,확인,lead01@example.com,,2026-10-09T17:05:00+09:00,
C-0002~5,T1-08,1,완료,user02@example.com,,2026-08-31T13:55:00+09:00,
C-0002~5,T1-08,2,완료,user02@example.com,,2026-09-30T12:12:00+09:00,
C-0002~5,T1-09,0,완료,user02@example.com,,2026-08-14T14:26:00+09:00,리더와 통화 후 처리
C-0003~2,T1-01,0,완료,user03@example.com,,2026-07-27T17:33:00+09:00,리더와 통화 후 처리
C-0003~2,T1-02,0,완료,user03@example.com,,2026-09-12T17:52:00+09:00,전원 확인
C-0003~2,T1-02,0,확인,lead02@example.com,,2026-09-12T18:52:00+09:00,
C-0003~2,T1-03,0,완료,user03@example.com,,2026-09-16T09:09:00+09:00,누락 1건 보완 후 완료
C-0003~2,T1-04,0,완료,user03@example.com,,2026-09-18T12:21:00+09:00,전원 확인
C-0003~2,T1-05,0,완료,user07@example.com,,2026-09-23T12:36:00+09:00,처리 완료
C-0003~2,T1-05,0,확인,lead02@example.com,,2026-09-25T13:36:00+09:00,
C-0003~2,T1-06,1,완료,user07@example.com,,2026-10-23T10:27:00+09:00,
C-0003~2,T1-06,1,확인,lead02@example.com,,2026-10-25T11:27:00+09:00,
C-0003~2,T1-09,0,완료,user03@example.com,,2026-09-30T12:31:00+09:00,
C-0003~2,T1-09,0,확인,lead02@example.com,,2026-10-02T13:31:00+09:00,
C-0004~1,T2-01,0,완료,user04@example.com,,2026-08-11T09:13:00+09:00,자료 첨부함
C-0004~1,T2-02,0,완료,user04@example.com,,2026-08-28T17:54:00+09:00,자료 첨부함
C-0004~1,T2-02,0,확인,lead02@example.com,,2026-08-28T18:54:00+09:00,
C-0004~1,T2-04,1,완료,user08@example.com,,2026-09-30T12:55:00+09:00,처리 완료
C-0004~1,T2-04,1,확인,lead02@example.com,,2026-10-01T13:55:00+09:00,
C-0004~1,T2-05,1,완료,user08@example.com,,2026-09-30T10:28:00+09:00,
C-0004~1,T2-05,1,확인,lead02@example.com,,2026-10-02T11:28:00+09:00,
C-0004~1,T2-06,0,완료,user04@example.com,,2026-09-22T15:33:00+09:00,
C-0005~2,T2-01,0,완료,user14@example.com,,2026-09-21T15:40:00+09:00,누락 1건 보완 후 완료
C-0005~2,T2-02,0,완료,user14@example.com,,2026-10-08T12:28:00+09:00,누락 1건 보완 후 완료
C-0005~2,T2-03,0,완료,user08@example.com,,2026-10-13T14:43:00+09:00,
C-0006~4,T1-01,0,완료,user05@example.com,,2026-09-16T12:09:00+09:00,전원 확인
C-0006~4,T1-02,0,완료,user05@example.com,,2026-10-15T14:29:00+09:00,처리 완료
C-0006~4,T1-02,0,확인,lead03@example.com,,2026-10-17T15:29:00+09:00,
C-0006~4,T1-03,0,완료,user05@example.com,,2026-10-14T11:12:00+09:00,누락 1건 보완 후 완료
C-0006~4,T1-05,0,완료,user07@example.com,,2026-10-23T16:02:00+09:00,
C-0006~4,T1-05,0,확인,lead03@example.com,,2026-10-25T17:02:00+09:00,
C-0007~1,T1-01,0,완료,user06@example.com,,2026-10-02T14:28:00+09:00,
C-0001~4,T1-01,0,완료,user01@example.com,,2026-10-19T09:48:00+09:00,자료 첨부함
C-0017~1,T1-01,0,완료,user02@example.com,,2026-01-06T15:23:00+09:00,리더와 통화 후 처리
C-0017~1,T1-04,0,완료,user02@example.com,,2026-02-27T16:25:00+09:00,
C-0017~1,T1-05,0,완료,user07@example.com,,2026-03-04T17:47:00+09:00,리더와 통화 후 처리
C-0017~1,T1-05,0,확인,admin01@example.com,,2026-03-05T18:47:00+09:00,
C-0017~1,T1-06,1,완료,user07@example.com,,2026-04-02T16:33:00+09:00,전원 확인
C-0017~1,T1-06,2,완료,user07@example.com,,2026-05-04T11:36:00+09:00,전원 확인
C-0017~1,T1-06,2,확인,admin01@example.com,,2026-05-05T12:36:00+09:00,
C-0017~1,T1-06,5,완료,user07@example.com,,2026-08-05T13:05:00+09:00,
C-0017~1,T1-06,5,확인,admin01@example.com,,2026-08-06T14:05:00+09:00,
C-0017~1,T1-06,6,완료,user07@example.com,,2026-08-31T15:21:00+09:00,
C-0017~1,T1-07,1,완료,user07@example.com,,2026-04-07T11:17:00+09:00,자료 첨부함
C-0017~1,T1-07,2,완료,user07@example.com,,2026-05-06T14:28:00+09:00,누락 1건 보완 후 완료
C-0017~1,T1-07,2,확인,admin01@example.com,,2026-05-07T15:28:00+09:00,
C-0017~1,T1-07,3,완료,user07@example.com,,2026-06-07T15:44:00+09:00,
C-0017~1,T1-07,3,확인,admin01@example.com,,2026-06-07T16:44:00+09:00,
C-0017~1,T1-07,4,완료,user07@example.com,,2026-07-09T14:19:00+09:00,리더와 통화 후 처리
C-0017~1,T1-07,5,완료,user07@example.com,,2026-08-05T11:25:00+09:00,
C-0017~1,T1-07,6,완료,user07@example.com,,2026-09-02T12:29:00+09:00,처리 완료
C-0017~1,T1-08,1,완료,user02@example.com,,2026-04-02T16:37:00+09:00,처리 완료
C-0017~1,T1-08,2,완료,user02@example.com,,2026-04-30T15:26:00+09:00,처리 완료
C-0017~1,T1-08,3,완료,user02@example.com,,2026-06-02T09:34:00+09:00,
C-0017~1,T1-08,4,완료,user02@example.com,,2026-06-30T15:03:00+09:00,리더와 통화 후 처리
C-0017~1,T1-08,5,완료,user02@example.com,,2026-07-31T17:52:00+09:00,누락 1건 보완 후 완료
C-0017~1,T1-08,6,완료,user02@example.com,,2026-08-27T10:20:00+09:00,
C-0017~1,T1-09,0,완료,user02@example.com,,2026-03-17T10:40:00+09:00,
C-0017~1,T1-09,0,확인,admin01@example.com,,2026-03-17T11:40:00+09:00,
C-0017~1,T1-10,0,완료,user02@example.com,,2026-04-29T09:35:00+09:00,처리 완료
C-0017~1,T1-11,0,완료,user02@example.com,,2026-08-18T16:18:00+09:00,
C-0017~1,T1-12,0,완료,user02@example.com,,2026-08-25T14:26:00+09:00,
C-0017~1,T1-13,0,완료,user07@example.com,,2026-09-01T12:44:00+09:00,누락 1건 보완 후 완료
C-0017~1,T1-14,0,완료,user07@example.com,,2026-09-11T11:03:00+09:00,
C-0017~1,T1-14,0,확인,admin01@example.com,,2026-09-11T12:03:00+09:00,
C-0017~1,T1-15,0,완료,user09@example.com,,2026-09-22T11:57:00+09:00,잘못 체크
C-0017~1,T1-15,0,취소,user09@example.com,,2026-09-22T12:04:00+09:00,다른 과정으로 착각
C-0017~1,T1-15,0,완료,user09@example.com,,2026-09-22T12:57:00+09:00,자료 첨부함
C-0018~2,T2-01,0,완료,user04@example.com,,2026-04-19T15:40:00+09:00,
C-0018~2,T2-02,0,완료,user04@example.com,,2026-05-08T17:20:00+09:00,자료 첨부함
C-0018~2,T2-02,0,확인,admin01@example.com,,2026-05-09T18:20:00+09:00,
C-0018~2,T2-03,0,완료,user08@example.com,,2026-05-11T17:37:00+09:00,전원 확인
C-0018~2,T2-03,0,확인,admin01@example.com,,2026-05-11T18:37:00+09:00,
C-0018~2,T2-04,1,완료,user08@example.com,,2026-06-11T14:27:00+09:00,
C-0018~2,T2-04,1,확인,admin01@example.com,,2026-06-12T15:27:00+09:00,
C-0018~2,T2-04,2,완료,user08@example.com,,2026-07-08T13:44:00+09:00,리더와 통화 후 처리
C-0018~2,T2-04,2,확인,admin01@example.com,,2026-07-10T14:44:00+09:00,
C-0018~2,T2-04,3,완료,user08@example.com,,2026-07-17T12:11:00+09:00,
C-0018~2,T2-04,3,확인,admin01@example.com,,2026-07-19T13:11:00+09:00,
C-0018~2,T2-05,1,완료,user08@example.com,,2026-06-15T15:26:00+09:00,누락 1건 보완 후 완료
C-0018~2,T2-05,1,확인,admin01@example.com,,2026-06-15T16:26:00+09:00,
C-0018~2,T2-05,2,완료,user08@example.com,,2026-07-15T11:55:00+09:00,
C-0018~2,T2-05,2,확인,admin01@example.com,,2026-07-16T12:55:00+09:00,
C-0018~2,T2-05,3,완료,user08@example.com,,2026-07-22T10:45:00+09:00,리더와 통화 후 처리
C-0018~2,T2-05,3,확인,admin01@example.com,,2026-07-23T11:45:00+09:00,
C-0018~2,T2-06,0,완료,user04@example.com,,2026-06-01T14:36:00+09:00,
C-0018~2,T2-07,0,완료,user04@example.com,,2026-07-13T16:14:00+09:00,전원 확인
C-0018~2,T2-08,0,완료,user08@example.com,,2026-07-20T11:59:00+09:00,
C-0018~2,T2-08,0,확인,admin01@example.com,,2026-07-21T12:59:00+09:00,
C-0018~2,T2-09,0,완료,user10@example.com,,2026-07-29T10:20:00+09:00,리더와 통화 후 처리
C-0018~2,T2-10,0,완료,user10@example.com,,2026-08-31T15:22:00+09:00,
C-0018~2,T2-10,0,확인,admin01@example.com,,2026-09-01T16:22:00+09:00,`
