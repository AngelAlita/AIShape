/**
 * 根据身高体重计算BMI
 * @param heightCm 身高(厘米)
 * @param weightKg 体重(公斤)
 * @returns BMI值，保留一位小数
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
    if (!heightCm || !weightKg) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  }
  
  /**
   * 根据BMI判断体重状态
   * @param bmi BMI值
   * @returns 体重状态描述
   */
  export function getBMIStatus(bmi: number): string {
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '正常';
    if (bmi < 28) return '超重';
    if (bmi < 30) return '轻度肥胖';
    if (bmi < 40) return '中度肥胖';
    return '重度肥胖';
  }
  
  /**
   * 计算理想体重范围（基于BMI 18.5-24的范围）
   * @param heightCm 身高(厘米)
   * @returns 理想体重范围，格式为：{min: 最小值, max: 最大值}
   */
  export function calculateIdealWeightRange(heightCm: number): {min: number, max: number} {
    if (!heightCm) return {min: 0, max: 0};
    const heightM = heightCm / 100;
    const minWeight = parseFloat((18.5 * heightM * heightM).toFixed(1));
    const maxWeight = parseFloat((24 * heightM * heightM).toFixed(1));
    return {min: minWeight, max: maxWeight};
  }
  
  /**
   * 估算基础代谢率(BMR)，使用修正的Harris-Benedict公式
   * @param heightCm 身高(厘米)
   * @param weightKg 体重(公斤)
   * @param age 年龄(岁)
   * @param gender 性别('male'或'female')
   * @returns 基础代谢率(卡路里/天)
   */
  export function calculateBMR(heightCm: number, weightKg: number, age: number, gender: string): number {
    if (!heightCm || !weightKg || !age) return 0;
    
    if (gender === 'male') {
      return Math.round(88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age));
    } else {
      return Math.round(447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age));
    }
  }
  
  /**
   * 计算每日卡路里需求(TDEE)
   * @param bmr 基础代谢率
   * @param activityLevel 活动水平(1.2-1.9)
   * @returns 每日卡路里需求
   */
  export function calculateTDEE(bmr: number, activityLevel: number): number {
    return Math.round(bmr * activityLevel);
  }
  
  /**
   * 计算体脂率(使用Navy公式)的简化实现
   * 注意：此计算结果为粗略估计，实际体脂率需要专业设备测量
   * @param heightCm 身高(厘米)
   * @param weightKg 体重(公斤)
   * @param waistCm 腰围(厘米)，如果没有提供则使用估算值
   * @param gender 性别('male'或'female')
   * @returns 估算的体脂率(%)
   */
  export function estimateBodyFat(heightCm: number, weightKg: number, waistCm: number | null, gender: string): number {
    if (!heightCm || !weightKg) return 0;
    
    // 如果没有提供腰围，使用基于体重的估算值
    const estimatedWaist = waistCm || (gender === 'male' ? weightKg * 0.8 : weightKg * 0.7);
    
    let bodyFat = 0;
    if (gender === 'male') {
      // 男性体脂率估算(简化)
      const bmi = calculateBMI(heightCm, weightKg);
      bodyFat = (1.20 * bmi) + (0.23 * estimatedWaist) - 16.2;
    } else {
      // 女性体脂率估算(简化)
      const bmi = calculateBMI(heightCm, weightKg);
      bodyFat = (1.20 * bmi) + (0.23 * estimatedWaist) - 5.4;
    }
    
    // 确保结果在合理范围内
    return parseFloat(Math.max(3, Math.min(45, bodyFat)).toFixed(1));
  }

  /**
 * 计算个性化营养目标
 * @param tdee 每日总能量消耗(卡路里)
 * @param weightGoal 目标体重(kg)
 * @param currentWeight 当前体重(kg)
 * @param gender 性别('male'或'female')
 * @param activityLevel 活动水平(默认值为1.4表示轻度活动)
 * @returns 返回营养目标对象，包括卡路里、蛋白质、碳水化合物和脂肪
 */
export function calculateNutritionGoals(
  tdee: number, 
  weightGoal: number, 
  currentWeight: number, 
  gender: string,
  activityLevel: number = 1.4
): {calories: number, protein: number, carbs: number, fats: number} {
  // 基于目标体重决定每日卡路里调整
  let calorieAdjustment = 0;
  
  if (weightGoal < currentWeight) {
    // 减重目标：每天减少500卡路里
    calorieAdjustment = -500;
  } else if (weightGoal > currentWeight) {
    // 增重目标：每天增加300卡路里
    calorieAdjustment = 300;
  }
  
  // 最终每日卡路里目标
  const calorieGoal = Math.max(1200, Math.round(tdee + calorieAdjustment));
  
  // 蛋白质：体重每公斤1.6-2.2克(减脂时取高值，增肌时也取高值)
  let proteinPerKg = 1.6;
  if (weightGoal < currentWeight || weightGoal > currentWeight) {
    proteinPerKg = 2.0;
  }
  const proteinGoal = Math.round(currentWeight * proteinPerKg);
  
  // 脂肪：总卡路里的25-30%
  const fatCalories = calorieGoal * (gender === 'male' ? 0.25 : 0.3);
  const fatGoal = Math.round(fatCalories / 9); // 脂肪1克=9卡路里
  
  // 碳水：剩余卡路里
  const proteinCalories = proteinGoal * 4; // 蛋白质1克=4卡路里
  const remainingCalories = calorieGoal - proteinCalories - fatCalories;
  const carbGoal = Math.round(remainingCalories / 4); // 碳水1克=4卡路里
  
  return {
    calories: calorieGoal,
    protein: proteinGoal,
    carbs: carbGoal,
    fats: fatGoal
  };
}