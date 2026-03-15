import { supabase } from "@/lib/supabase";
import { trackGoal } from "./analytics";

export async function saveScoreToDB(testName: string, finalScore: number) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      // Пользователь авторизован — пишем в Supabase
      const playerName = session.user.user_metadata?.full_name || "Аноним";
      const userCountry = session.user.user_metadata?.country || "RU";

      const { error } = await supabase.from("scores").insert([
        {
          user_id: session.user.id,
          test_name: testName,
          score: finalScore,
          player_name: playerName,
          country: userCountry,
        },
      ]);

      if (error) throw error;
      console.log(`✅ [DB] Сохранено: ${testName} - ${finalScore}`);
    } else {
      // Гость — пишем в LocalStorage
      const newRecord = {
        test: testName,
        score: finalScore,
        date: new Date().toISOString(),
      };
      const existingHistory = JSON.parse(
        localStorage.getItem("guest_history") || "[]",
      );
      localStorage.setItem(
        "guest_history",
        JSON.stringify([newRecord, ...existingHistory]),
      );

      console.log(`✅ [Local] Сохранено: ${testName} - ${finalScore}`);
    }

    const safeGoalName = testName.replace(/\s+/g, "_");
    trackGoal(`test_completed_${safeGoalName}`);

    // И общую цель для конверсии
    trackGoal("any_test_completed");
  } catch (err) {
    console.error("❌ Ошибка при автосохранении:", err);
  }
}
