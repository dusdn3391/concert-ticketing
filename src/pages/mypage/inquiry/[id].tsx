// pages/mypage/inquiryDetail/[id].tsx
import { useRouter } from "next/router";
import styles from "@/pages/mypage/inquiry/inquiryDetail.module.css";
import MypageNav from "@/components/user/MypageNav";

export default function InquiryDetail() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <h1 className={styles.title}>마이페이지</h1>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.inquiryContent}>
              <div className={styles.inquiryTitle}>1:1 문의내역</div>
              <div className={styles.chating}>
                <div className={styles.chatBox}>
                  <div className={styles.messageWrapper}>
                    <div
                      className={styles.messageRow}
                      style={{ justifyContent: "flex-end" }}
                    >
                      <span className={styles.date}>2025-05-25</span>
                      <div className={styles.answer}>
                        <p>이 상품은 언제 배송되나요?</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.messageWrapper}>
                    <div className={styles.messageRow}>
                      <div className={styles.question}>
                        <p>문의 주셔서 감사합니다. 2~3일 내 출고 예정입니다.</p>
                      </div>
                      <span className={styles.date}>2025-05-26</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
