const YM_COUNTER_ID = 107196044;

export const trackGoal = (goalName: string) => {
  // Проверяем, что мы в браузере (не на сервере) и что метрика не заблокирована адблоком
  if (
    typeof window !== "undefined" &&
    typeof (window as any).ym !== "undefined"
  ) {
    (window as any).ym(YM_COUNTER_ID, "reachGoal", goalName);
    console.log(`🎯 [Метрика] Цель достигнута: ${goalName}`); // Дебаг в консоли
  } else {
    console.log(`🛑 [Метрика заблок.] Цель была бы отправлена: ${goalName}`);
  }
};
