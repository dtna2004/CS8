Để chạy ta làm như sau:
git clone https://github.com/dtna2004/CS8.git
mở index.html


Ý tưởng bài toán
Bài toán tìm đường đi ngắn nhất đa mục tiêu yêu cầu tìm một đường đi:

Qua các điểm bắt buộc: Các điểm này phải nằm trên đường đi.
Không đi qua các điểm chặn: Các điểm này bị cấm, không được phép đi qua.
Tối ưu hóa chi phí: Ví dụ, quãng đường ngắn nhất, năng lượng tiêu thụ tối thiểu, hoặc kết hợp nhiều tiêu chí.
Bài toán này thuộc loại tối ưu hóa ràng buộc, trong đó cần cân bằng giữa các yếu tố đa mục tiêu và các ràng buộc.

Cách hoạt động của thuật toán trong giải pháp
Biểu diễn bài toán:

Biểu diễn các vị trí trong không gian bằng đồ thị (graph). Các điểm (nodes) là vị trí, các cạnh (edges) là đường đi giữa chúng.
Gán trọng số cho các cạnh: ví dụ, độ dài, thời gian di chuyển, hoặc chi phí năng lượng.
Ràng buộc:

Điểm bắt buộc: Các điểm này phải được ghé thăm ít nhất một lần trên đường đi.
Điểm chặn: Loại bỏ các điểm chặn khỏi đồ thị, hoặc gán trọng số vô cùng lớn cho các cạnh kết nối với chúng.
Mục tiêu tối ưu:

Độ dài đường đi: Tìm đường đi ngắn nhất.
Năng lượng tiêu thụ: Tối ưu hóa năng lượng còn lại khi đi qua các điểm bắt buộc.
Tiếp cận ánh sáng (hoặc nguồn tài nguyên): Ưu tiên các điểm gần nguồn tài nguyên hơn.
Quy trình thuật toán
Khởi tạo:

Bắt đầu từ điểm xuất phát, tạo ra một nhánh (branch) với thông tin như đường đi hiện tại, năng lượng, và các điểm đã ghé thăm.
Phát triển nhánh (Branching):

Từ mỗi nhánh hiện tại, tìm các điểm lân cận có thể đến được (không phải điểm chặn và chưa nằm trong đường đi).
Với mỗi điểm lân cận, tạo một nhánh mới, cập nhật thông tin như:
Quãng đường đã đi.
Năng lượng còn lại.
Các điểm bắt buộc đã ghé qua.
Tính điểm số (Scoring):

Tính điểm số của mỗi nhánh dựa trên:
Khoảng cách đã đi qua.
Khoảng cách tới đích.
Số điểm bắt buộc đã ghé thăm.
Tiêu chí bổ sung (năng lượng, ánh sáng, ...).
Cắt tỉa (Pruning):

Loại bỏ các nhánh không khả thi (ví dụ: năng lượng không đủ, không đi qua hết điểm bắt buộc).
Giữ lại một số nhánh tốt nhất dựa trên điểm số.
Kết thúc:

Khi tìm được nhánh đi qua tất cả điểm bắt buộc và đến đích, thuật toán dừng lại.
Trong trường hợp tìm tất cả các đường, thuật toán tiếp tục đến khi duyệt hết các khả năng.