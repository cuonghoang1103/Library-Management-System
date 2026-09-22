# SWT301: Cài project + tool test trên máy khác để thuyết trình

Project: **Library Management System** (Spring Boot 3.4 + React 18)
GitHub: https://github.com/cuonghoang1103/Library-Management-System

Tool dùng trong bài: **SonarQube** (quét mã tĩnh) · **Maven + JUnit** (`mvn test`, chạy trong CMD) · **JaCoCo** (đo độ phủ).

> **Hai nhánh trên GitHub (22/09/2026):**
> - **`swt301-bao-cao`** — code GỐC + 13 test bằng chứng (`KnownDefectsTest.java`,
>   `KnownDefectsDbTest.java`). Dùng để trình bày **"tool báo lỗi"**: 13 test ĐỎ.
> - **`swt301-da-sua`** — nối tiếp nhánh trên, thêm **17 commit sửa 15 defect** (mỗi bug
>   một commit `fix(BUG-xx): …`). Dùng để trình bày **"sau khi sửa"**: 125 test XANH.
>
> Slide mẫu 68 trang (tiếng Anh): xem từng slide ở bài **Lab 2.5.6** của môn SWT301 trên
> cuongthai.com, hoặc tải thẳng
> [.pptx](https://media.cuongthai.com/files/academy/SWT301/v2/SWT301-Lab2.5-Sample-Slides-Library-Management-System.pptx) ·
> [.pdf](https://media.cuongthai.com/files/academy/SWT301/v2/SWT301-Lab2.5-Sample-Slides-Library-Management-System.pdf).

---

## 1. Cài phần mềm (một lần, khoảng 20–30 phút)

| Phần mềm | Windows | macOS |
|---|---|---|
| **JDK 21** (bắt buộc bản 21) | https://adoptium.net → Temurin 21 (.msi), khi cài **tích "Set JAVA_HOME"** | `brew install --cask temurin@21` |
| **Maven 3.9** | https://maven.apache.org/download.cgi → tải `apache-maven-3.9.x-bin.zip`, giải nén vào `C:\maven`, thêm `C:\maven\bin` vào biến môi trường **Path** | `brew install maven` |
| **Git** (tuỳ chọn) | https://git-scm.com | có sẵn |
| **Docker Desktop** (để chạy SonarQube) | https://www.docker.com/products/docker-desktop (cần WSL2 và quyền admin) | như Windows |
| **IntelliJ IDEA Community** hoặc **VS Code** (để mở code cho cô xem) | jetbrains.com / code.visualstudio.com | như Windows |

Kiểm tra (mở **CMD** mới sau khi cài):

```bat
java -version
mvn -version
docker --version
```

`mvn -version` phải ghi **Java version: 21**. Nếu ghi 17, 22 hay 25 thì sửa `JAVA_HOME`
trỏ về thư mục JDK 21. Chạy Maven bằng JDK 25 sẽ lỗi hàng loạt: JaCoCo và Mockito
chưa hỗ trợ Java 25, và 60 test sẽ báo lỗi dù code không sai.

---

## 2. Tải source

**Cách A — có Git:**

```bat
git clone https://github.com/cuonghoang1103/Library-Management-System.git
cd Library-Management-System
git checkout swt301-bao-cao
```

**Cách B — không cần Git:** mở trang GitHub → chọn nhánh `swt301-bao-cao` → nút xanh
**Code → Download ZIP** → giải nén.

Bản đã sửa: `git checkout swt301-da-sua` (hoặc tải ZIP của nhánh `swt301-da-sua`).
Xem riêng bản sửa của một bug: `git log --oneline swt301-bao-cao..swt301-da-sua` rồi
`git show <mã commit>`.

---

## 3. Chạy test (tool: CMD + Maven + JUnit + JaCoCo)

```bat
cd backend
mvn test
```

Lần đầu Maven tải thư viện, mất 3–5 phút. Kết quả mong đợi (112 test có sẵn của dự án):
`Tests run: 112, Failures: 0, Errors: 0, Skipped: 3` · `BUILD SUCCESS`.

**Chạy 13 test bằng chứng defect** (dùng khi thuyết trình). Chúng gắn tag `known-defect`
nên `mvn test` thường bỏ qua; phải gọi riêng:

```bat
mvn test -Dgroups=known-defect -DexcludedGroups=
```

Kết quả mong đợi: `Tests run: 13, Failures: 13` và **`BUILD FAILURE` — đúng như ý muốn**.
Mỗi test mô tả hành vi ĐÚNG, nên test ĐỎ nghĩa là defect có thật (đây là "ảnh tool báo lỗi").

Chạy riêng test của một bug (CMD trên Windows):

```bat
mvn test -Dgroups=known-defect -DexcludedGroups= -Dtest=KnownDefectsTest$TV1_BUG01_LateReturnBlocksReborrow
```

| Bug | Tên test (sau `-Dtest=`) |
|---|---|
| BUG-01 | `KnownDefectsTest$TV1_BUG01_LateReturnBlocksReborrow` |
| BUG-02 | `KnownDefectsTest$TV1_BUG02_OverdueFeeNeverCharged` |
| BUG-03 | `KnownDefectsTest$TV1_BUG03_BorrowLimitNotEnforced` |
| BUG-04 | `KnownDefectsDbTest$TV2_BUG04_IsbnSearchFindsNothing` |
| BUG-05 | `KnownDefectsDbTest$TV2_BUG05_DeleteBookWipesLoans` |
| BUG-06 | `KnownDefectsTest$TV2_BUG06_DuplicateIsbnGives500` |
| BUG-07 | `KnownDefectsTest$TV3_BUG07_LockedAccountKeepsAccess` |
| BUG-08 | `KnownDefectsTest$TV3_BUG08_DefaultPassword` |
| BUG-09 | (không có test — SonarQube, rule java:S6437) |
| BUG-10 | `KnownDefectsTest$TV4_BUG10_ReservationQueueNeverMoves` |
| BUG-11 | `KnownDefectsTest$TV4_BUG11_LibrarianCannotCancelReservation` |
| BUG-12 | `KnownDefectsTest$TV4_BUG12_ReviewWithoutRatingGives500` |
| BUG-13 | `KnownDefectsTest$TV5_BUG13_NoNotificationIsCreated` |
| BUG-14 | (không có test — SonarQube, rule java:S2229) |
| BUG-15 | `KnownDefectsTest$TV5_BUG15_SettingsAreIgnored` |

**Sau khi sửa** (nhánh `swt301-da-sua`): hai lệnh trên cho kết quả

- `mvn test` → `Tests run: 125, Failures: 0, Errors: 0, Skipped: 3` · `BUILD SUCCESS`
  (112 test cũ + 13 test defect, giờ đã chạy chung như test hồi quy)
- `mvn test -Dgroups=known-defect -DexcludedGroups=` → `Tests run: 13, Failures: 0` · `BUILD SUCCESS`

Đó là ảnh "sau khi sửa" (mục 4 của form): **confirmation test** (đúng test đó giờ xanh) và
**regression test** (chạy lại toàn bộ, không hỏng chỗ khác).

> Lưu ý dấu `$` trong tên test:
> - **CMD**: gõ nguyên như trên.
> - **PowerShell**: bọc trong nháy ĐƠN, và bọc cả các tham số `-D` khác:
>   `mvn test "-Dgroups=known-defect" "-DexcludedGroups=" '-Dtest=KnownDefectsTest$TV1_BUG01_LateReturnBlocksReborrow'`
> - **macOS / Linux**: bọc `-Dtest=...` trong nháy ĐƠN.

Báo cáo độ phủ JaCoCo: mở tệp `backend\target\site\jacoco\index.html` bằng trình duyệt.

---

## 4. SonarQube (tool quét mã)

**4.1 Khởi động** (lần đầu tải image khoảng 1 GB):

```bat
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

Đợi khoảng 1–2 phút rồi mở http://localhost:9000.

**4.2 Lần đầu:** đăng nhập `admin` / `admin` → SonarQube bắt đổi mật khẩu → **Create
project → Manually** → Project key: `library-management-swt301` → **Locally** →
**Generate token** → chép token (dạng `squ_…`).

**4.3 Quét** (CMD, trong thư mục `backend`, viết trên **một dòng**):

```bat
mvn org.sonarsource.scanner.maven:sonar-maven-plugin:3.9.1.2184:sonar -Dsonar.projectKey=library-management-swt301 -Dsonar.host.url=http://localhost:9000 -Dsonar.login=TOKEN_VUA_TAO -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

(Chạy `mvn test` trước để có số liệu độ phủ.) Xong, mở lại http://localhost:9000 →
dashboard sẽ hiện **Bugs / Vulnerabilities / Code Smells / Coverage**.

Lần sau chỉ cần: `docker start sonarqube`.

---

## 5. (Tuỳ chọn) Chạy cả ứng dụng để demo

> ⛔ **Với code hiện tại, `docker compose up -d --build` HỎNG ở bước build backend** — đã
> chạy thử thật ngày 22/09/2026: `error: release version 21 not supported`.
> Nguyên nhân: `backend/Dockerfile` dựng bằng **JDK 17** (`maven:3.9-eclipse-temurin-17`,
> `eclipse-temurin:17-jre`) trong khi `pom.xml` đòi **Java 21**. Đây cũng là một defect
> thật (đã đưa vào phụ lục "Backup defects" của slide).

Muốn demo thì sửa 2 dòng `FROM` trong `backend/Dockerfile` thành bản 21 trước:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
...
FROM eclipse-temurin:21-jre
```

rồi mới chạy:

```bat
docker compose up -d --build
```

Web: http://localhost:3000 · API: http://localhost:8080
Tài khoản demo: `librarian` / `librarian123` · `member` / `member123`
(chính hai mật khẩu viết cứng này là một defect SonarQube báo: DataLoader.java dòng 29, 44).
Không có thời gian thì bỏ qua phần demo này — slide đã có đủ ảnh.

---

## 6. Kịch bản thuyết trình 5–7 phút

1. **Giới thiệu** (30 giây): project quản lý thư viện; tool là SonarQube, Maven/JUnit và JaCoCo.
2. **SonarQube dashboard** (1 phút): chỉ các số Bugs, Vulnerabilities, Code Smells và Coverage.
3. **Một lỗi do tool tìm ra** (1 phút): mở issue mật khẩu viết cứng → bấm vào để thấy dòng code.
4. **Lỗi tool KHÔNG tìm ra** (2 phút): chạy test của BUG-01 (lệnh ở mục 3) → test ĐỎ với
   thông điệp "After return the loan must be CLOSED… but was: OVERDUE": trả sách muộn thì
   bản sao đó không mượn lại được nữa. SonarQube không hề báo lỗi này.
   Rồi `git checkout swt301-da-sua`, chạy lại đúng lệnh đó → XANH (ảnh "sau khi sửa").
5. **Lỗi tool xếp sai mức** (1 phút): SonarQube gọi `LoanService` dòng 129 là "biến không
   dùng" (mức Minor). Thật ra đó là dấu vết của chức năng tính phí quá hạn bị bỏ quên:
   thư viện không thu được đồng phạt nào, nên phải là Major.
6. **Kết luận** (30 giây): *"Tool tìm theo mẫu, con người tìm theo yêu cầu. Tool hỗ trợ,
   còn phán đoán và viết report là việc của tester."*

---

## 7. Sự cố hay gặp

| Triệu chứng | Cách xử lý |
|---|---|
| Hàng chục test lỗi `Unsupported class file major version 69` | Maven đang chạy JDK 25 → sửa `JAVA_HOME` về JDK 21 |
| `mvn` không nhận lệnh | chưa thêm `C:\maven\bin` vào Path, hoặc chưa mở CMD mới |
| PowerShell báo lỗi ở `-Dsonar...` | dùng CMD, hoặc đặt từng tham số `-D` trong nháy kép |
| SonarQube không lên | Docker Desktop chưa chạy; máy cần tối thiểu 4 GB RAM trống |
| Máy mượn không cài được Docker | trình bày SonarQube bằng ảnh chụp trong báo cáo; phần `mvn test` vẫn chạy trực tiếp được |
