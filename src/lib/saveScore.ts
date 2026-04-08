import { supabase } from "@/lib/supabase";
import { trackGoal } from "@/lib/analytics";

// Функция для получения или создания локального ID устройства
const getDeviceId = () => {
  if (typeof window === "undefined") return null;
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    // Генерируем уникальный UUID браузера
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

export async function saveScoreToDB(testName: string, finalScore: number) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const deviceId = getDeviceId();

    let userId = null;
    let playerName = "Гость";
    let userCountry = "OTHER";

    if (session?.user) {
      // Пользователь авторизован
      userId = session.user.id;
      playerName = session.user.user_metadata?.full_name || "Игрок";
      userCountry = session.user.user_metadata?.country || "RU";
    } else {
      // Пользователь Гость - всё равно сохраняем локально для надежности
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
    }

    // СОХРАНЯЕМ В БАЗУ ВСЕГДА (и для гостей, и для юзеров)
    const { error } = await supabase.from("scores").insert([
      {
        user_id: userId, // У гостей тут будет null
        device_id: deviceId, // Локальный ID (чтобы потом привязать аккаунт)
        test_name: testName,
        score: finalScore,
        player_name: playerName,
        country: userCountry,
      },
    ]);

    if (error) throw error;
    console.log(
      `✅ [DB] Сохранено: ${testName} - ${finalScore} (Игрок: ${playerName})`,
    );

    // Метрика
    const safeGoalName = testName.replace(/\s+/g, "_");
    trackGoal(`test_completed_${safeGoalName}`);
    trackGoal("any_test_completed");
  } catch (err) {
    console.error("❌ Ошибка при автосохранении:", err);
  }
}
