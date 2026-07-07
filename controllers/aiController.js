import Chat from "../models/Chat.js";

// ============================================
// YOUR ACTUAL DOCTORS
// ============================================
const DOCTORS = [
  { name: "Dr. Riya",    speciality: "Dermatologist",      tag: "derma"   },
  { name: "Dr. Navya",   speciality: "General Physician",  tag: "general" },
  { name: "Dr. Deepa",   speciality: "Neurologist",        tag: "neuro"   },
  { name: "Dr. Rachana", speciality: "Pediatrician",       tag: "pedia"   },
  { name: "Dr. Kavya",   speciality: "Gynecologist",       tag: "gyno"    },
  { name: "Dr. Bhavana", speciality: "Gastroenterologist", tag: "gastro"  },
];

const getDoc = (tag) => DOCTORS.find(d => d.tag === tag);

// ============================================
// GREETING PATTERNS
// ============================================
const GREETINGS = [
  "hi","hii","hiii","hiiii","hey","heyyy","hello","helo","helloo","hellooo",
  "good morning","good afternoon","good evening","good night","gm","gn",
  "namaste","howdy","sup","what's up","whats up","hola","hai","heyy"
];

const isGreeting = (msg) => {
  const m = msg.toLowerCase().trim();
  return GREETINGS.some(g => m === g || m.startsWith(g + " ") || m.startsWith(g + "!") || m.startsWith(g + ","));
};

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
};

// ============================================
// SYMPTOM DETECTOR
// ============================================
const detectSymptom = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes("headache") || m.includes("head ache") || m.includes("head pain") || m.includes("migraine")) return "headache";
  if (m.includes("stomach") || m.includes("tummy") || m.includes("belly") || m.includes("abdom") || m.includes("stomach ache")) return "stomach";
  if (m.includes("cold") || m.includes("runny nose") || m.includes("sneezing") || m.includes("blocked nose")) return "cold";
  if (m.includes("cough") || m.includes("coughing")) return "cough";
  if (m.includes("fever") || m.includes("temperature") || m.includes("chills") || m.includes("hot body")) return "fever";
  if (m.includes("skin") || m.includes("rash") || m.includes("itch") || m.includes("acne") || m.includes("pimple")) return "skin";
  if (m.includes("vomit") || m.includes("nausea") || m.includes("throw up") || m.includes("nauseous")) return "vomiting";
  if (m.includes("diarrhea") || m.includes("loose motion") || m.includes("watery stool") || m.includes("loose stool")) return "diarrhea";
  if (m.includes("chest pain") || m.includes("heart pain") || m.includes("chest tight")) return "chest";
  if (m.includes("back pain") || m.includes("backache") || m.includes("back ache")) return "backpain";
  if (m.includes("eye") || m.includes("eyes hurt") || m.includes("eye pain")) return "eyes";
  if (m.includes("throat") || m.includes("sore throat") || m.includes("throat pain")) return "throat";
  if (m.includes("tired") || m.includes("fatigue") || m.includes("weakness") || m.includes("exhausted")) return "fatigue";
  return null;
};

// ============================================
// DURATION DETECTOR
// ============================================
const detectDuration = (msg) => {
  const m = msg.toLowerCase();
  const longTerms = ["2 day","3 day","4 day","5 day","week","days","long time","since yesterday","2days","3days","few days","since last"];
  const recentTerms = ["today","just","hour","this morning","started","now","few hours","1 day","one day","just now","since morning"];
  if (longTerms.some(t => m.includes(t))) return "long";
  if (recentTerms.some(t => m.includes(t))) return "recent";
  // If they gave a number
  if (/\b[3-9]\b|\b[1-9][0-9]\b/.test(m)) return "long";
  if (/\b[12]\b/.test(m) && m.includes("day")) return "long";
  return "recent"; // default to recent if unclear
};

// ============================================
// FOLLOW-UP QUESTION per symptom
// ============================================
const getFollowUpQ = (symptom) => {
  const q = {
    headache: "I understand 🤕 One more question — can you describe the pain?\n\n• Is it a **throbbing/pulsing** pain?\n• Or more like **pressure/tightness** around your head or forehead?",
    stomach:  "Got it 😟 Can you tell me where exactly you feel the pain?\n\n• Is it in the **center** of your stomach?\n• Or on the **sides** (left or right side)?",
    cold:     "I see 🤧 Is your nose mainly:\n\n• **Runny** (watery discharge flowing out)?\n• Or **blocked/stuffy** (can't breathe through nose)?",
    cough:    "Noted 😷 Can you describe your cough:\n\n• Is it a **dry cough** (tickling throat, no mucus)?\n• Or a **wet cough** (with phlegm/mucus coming out)?",
    fever:    "I see 🌡️ Along with the fever, do you also have:\n\n• **Body aches, chills, or joint pain**?\n• Or is it just high temperature **without body pain**?",
    skin:     "I understand 😕 Can you describe the skin issue:\n\n• Is it a **rash or redness** on a specific area?\n• Or **itching all over** the body without a visible rash?",
    vomiting: "Oh no 🤢 Along with nausea/vomiting, do you also have:\n\n• **Stomach pain or cramps**?\n• Or just vomiting **without any stomach pain**?",
    diarrhea: "I see 💧 Along with loose motions, do you also have:\n\n• **Stomach cramps or pain**?\n• Or just **watery stools without pain**?",
    backpain: "I understand 😣 Can you tell me:\n\n• Is the pain in your **upper back** (between shoulders)?\n• Or in your **lower back** (above hips)?",
    throat:   "I see 😮‍💨 Is your throat:\n\n• **Itchy and scratchy** (like something stuck)?\n• Or **swollen and painful** (hurts when you swallow)?",
    fatigue:  "I understand 😔 Along with tiredness, do you also have:\n\n• **Headache or body aches**?\n• Or just **tiredness and weakness** without pain?",
    eyes:     "I see 👁️ Can you describe your eye issue:\n\n• **Redness and itching** (like allergy)?\n• Or **pain and sensitivity to light**?",
  };
  return q[symptom] || "Can you describe your symptom a bit more so I can help you better?";
};

// ============================================
// FINAL ADVICE
// ============================================
const getFinalAdvice = (symptom, duration, answer) => {
  const m = answer.toLowerCase();
  const isLong = duration === "long";

  switch (symptom) {

    case "stomach": {
      const doc = getDoc("gastro");
      const isCenter = m.includes("center") || m.includes("middle");
      const isSide = m.includes("side") || m.includes("left") || m.includes("right");
      if (isCenter && !isLong) return `Sounds like **gastric issues or indigestion** 🫁\n\n🌿 **Home Remedies:**\n• Drink warm water with a pinch of ginger\n• Sip **jeera (cumin) water** — boil 1 tsp cumin, strain and drink\n• Have light food — khichdi or plain rice\n• Avoid spicy, oily, and heavy meals\n• Don't lie down right after eating\n\n💊 **Medicines you can try:**\n• **Digene syrup** or **Gelusil** — 2 tsp after meals\n• **ENO** — dissolve in water for quick relief\n\n✅ You should feel better within a day! If not, please consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) available on Prescripto. 😊`;
      if (isCenter && isLong) return `Center stomach pain for 2+ days could be **gastritis, peptic ulcer, or acid reflux** ⚠️\n\n💊 **Temporary relief:**\n• **Pantoprazole 40mg** — take before breakfast\n• **Gelusil** or **Mucaine gel** after meals\n\n🚨 Please don't delay — book an appointment with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto today. This needs proper diagnosis! 🙏`;
      if (isSide && !isLong) return `Side stomach pain is usually **gas or acidity** 💨\n\n🌿 **Home Remedies:**\n• Take **ENO** dissolved in a glass of water\n• Drink **buttermilk with a pinch of hing** (asafoetida)\n• Walk slowly for 10 minutes after meals\n• Avoid carbonated drinks, raw onions, and beans\n\n💊 **Medicines:**\n• **ENO**, **Pudin Hara**, or **Gas-O-Fast** — effective for gas/acidity\n\n✅ Should improve quickly! If it doesn't, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 😊`;
      if (isSide && isLong) return `⚠️ Side stomach pain for 2+ days could be **IBS, kidney stone, or appendicitis** (especially lower right side).\n\n🚨 If the pain is **severe on the lower right side**, go to emergency immediately — it may be appendicitis!\n\nOtherwise, please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto right away. Don't ignore this! 🙏`;
      return !isLong
        ? `Stomach pain is likely **indigestion** 🫁\n\nTry: warm ginger tea, **ENO** for relief, light food. If no improvement, see 👩‍⚕️ **${doc.name}** on Prescripto. 😊`
        : `2+ days of stomach pain needs attention. Please consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 🙏`;
    }

    case "headache": {
      const doc = getDoc("neuro");
      const isThrobbing = m.includes("throb") || m.includes("puls") || m.includes("pound");
      if (!isLong) return `${isThrobbing ? "Throbbing headache sounds like a **migraine or tension headache** 🤕" : "Pressure headache is usually from **stress, sinus, or dehydration** 😮‍💨"}\n\n🌿 **Home Remedies:**\n• Drink 2-3 glasses of water immediately — dehydration is the #1 cause!\n• Apply **peppermint oil** on your temples and forehead\n• Massage your forehead and back of the neck gently\n• Lie in a dark quiet room for 20-30 minutes\n• Have **ginger tea with honey**\n• Cold or warm compress on forehead (try both to see what works)\n\n💊 **Medicines:**\n• **Crocin 500mg** (Paracetamol) — safe to take every 6 hours\n• **Saridon** or **Combiflam** for stronger relief\n\n✅ Most headaches resolve in 1-2 hours with rest and water. If it continues, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 😊`;
      return `A headache lasting 2+ days needs proper attention 🏥\n\nThis could be **chronic migraine, sinusitis, or high BP**.\n\n💊 **Temporary:** **Ibuprofen 400mg** with food or **Combiflam**.\n\n⚠️ Please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. A proper neurological checkup is important! 🙏`;
    }

    case "cold": {
      const doc = getDoc("general");
      const isRunny = m.includes("runny") || m.includes("water") || m.includes("flow");
      if (!isLong) return `${isRunny ? "A runny nose is usually early-stage cold 🤧" : "A blocked nose is really uncomfortable 😤"}\n\n🌿 **Home Remedies:**\n• **Steam inhalation** with 3-4 drops of eucalyptus oil — 2 times a day (10 min each)\n• **Turmeric milk** (haldi doodh) before bed — 1 glass\n• **Tulsi-ginger-honey tea** — 2-3 times a day\n• Stay warm, avoid cold water and ice cream\n• Inhale steam from a bowl of hot water with your head covered by a towel\n\n💊 **Medicines:**\n• **Cetirizine 10mg** — 1 tablet at night (antihistamine)\n• **Otrivin** nasal drops — 2 drops in each nostril if blocked\n• **Vicks VapoRub** on chest, nose, and back before sleeping\n\n✅ Cold usually resolves in 3-5 days! If not, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 😊`;
      return `Cold lasting 2+ days may be **sinus infection or allergic rhinitis** 😷\n\n💊 **Medicines:** **Sinarest tablet**, **Allegra**, or **Montair-LC** once daily.\n\nPlease consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto for proper treatment. 🙏`;
    }

    case "cough": {
      const doc = getDoc("general");
      const isDry = m.includes("dry") || m.includes("no phlegm") || m.includes("tickl");
      if (!isLong) return `${isDry ? "A **dry cough** is usually throat irritation or allergy 😮‍💨" : "A **wet cough** with mucus means your body is fighting an infection 🤧"}\n\n🌿 **Home Remedies:**\n• **Honey + ginger juice** — mix 1 tsp each, take 3 times a day. This is very effective!\n• **Warm salt water gargle** — 1/2 tsp salt in warm water, gargle 3 times daily\n• **Tulsi kadha** — boil tulsi leaves with ginger and black pepper, add honey\n• Sip **warm lemon honey water** throughout the day\n• Avoid cold drinks, AC directly blowing on you, and dusty areas\n• Sleep with head slightly elevated\n\n💊 **Medicines:**\n• Dry cough: **Benadryl cough syrup** or **Honitus** — 2 tsp twice a day\n• Wet cough: **Alex cough syrup** or **Chericof** — 2 tsp 3 times a day\n• **Strepsils** lozenges for throat soothing\n\n✅ Should improve in 2-4 days! If not, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 😊`;
      return `Cough for 2+ days could be **bronchitis, asthma, or chest infection** 🏥\n\n💊 **Temporary:** **Mucinex** or **Grilinctus** syrup for mucus relief.\n\n⚠️ Please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto for proper diagnosis. 🙏`;
    }

    case "fever": {
      const doc = getDoc("general");
      const hasAche = m.includes("ache") || m.includes("pain") || m.includes("chills") || m.includes("body");
      if (!isLong) return `${hasAche ? "Fever with body aches suggests **viral flu or dengue** 🌡️" : "Fever alone is usually a **viral infection** 🌡️"}\n\n🌿 **Home Remedies:**\n• Drink **plenty of water, coconut water, and ORS** every hour\n• Apply a **cool damp cloth** on your forehead and wrists\n• Eat light — **khichdi, dal soup, or vegetable broth**\n• Rest completely and stay covered (not too warm)\n• **Ginger + tulsi + black pepper tea** with honey — boosts immunity\n• Take a lukewarm bath if temperature is very high\n\n💊 **Medicines:**\n• **Crocin 650mg** (Paracetamol) — every 6 hours with water. Do NOT take on empty stomach\n• **Dolo 650** — alternative to Crocin\n\n⚠️ **Warning signs to rush to doctor immediately:**\n• Fever above **103°F (39.4°C)**\n• Rash appearing on body\n• Severe headache or stiff neck\n• Difficulty breathing\n\n✅ If fever persists beyond 2 days, please consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
      return `⚠️ Fever for 2+ days is serious — could be **typhoid, dengue, malaria, or UTI**!\n\n🔬 Please get a **blood test (CBC)** done immediately.\n\n🚨 Book an appointment with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto **today**. Do not delay! 🙏`;
    }

    case "skin": {
      const doc = getDoc("derma");
      const isRash = m.includes("rash") || m.includes("red") || m.includes("spot") || m.includes("area");
      if (!isLong) return `${isRash ? "A localized **rash or redness** could be allergic reaction, heat rash, or insect bite 🔴" : "**Itching all over** the body is usually due to allergy, dry skin, or heat 🌡️"}\n\n🌿 **Home Remedies:**\n• Apply **pure aloe vera gel** on the affected area — very soothing\n• Use **coconut oil** as moisturizer if skin is dry and flaky\n• Take a **cool shower** — avoid hot water completely\n• Do NOT scratch — it makes rash worse and can cause infection\n• Wear loose, breathable **cotton clothing**\n• Apply a cold ice pack wrapped in cloth on itchy areas\n\n💊 **Medicines:**\n• **Cetirizine 10mg** — 1 tablet at night for itching\n• **Calamine lotion** — apply on rash area 3 times daily\n• **Soframycin cream** — if there's any broken skin or wound\n\n✅ Should improve in 1-2 days! If not, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 😊`;
      return `Skin issue for 2+ days needs a specialist 🏥\n\nCould be **eczema, psoriasis, fungal infection, or dermatitis**.\n\n⚠️ Please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. Skin conditions need proper diagnosis! 🙏`;
    }

    case "vomiting": {
      const doc = getDoc("gastro");
      const hasPain = m.includes("pain") || m.includes("ache") || m.includes("cramp");
      if (!isLong) return `${hasPain ? "Vomiting with stomach pain could be **food poisoning or gastritis** 🤢" : "Nausea without pain is usually **motion sickness or mild viral** 🤢"}\n\n🌿 **Home Remedies:**\n• Sip **cold water or ice chips** very slowly — don't gulp\n• Drink **ginger ale or ginger tea with honey**\n• Eat **plain dry crackers, toast, or banana** once nausea reduces\n• Take **ORS solution** to stay hydrated\n• Rest and avoid strong smells\n• Smell a **lemon wedge** to reduce nausea\n\n💊 **Medicines:**\n• **Domstal 10mg** or **Emeset 4mg** — anti-nausea tablet\n• **ORS sachets** — mix in 1 litre water and sip throughout the day\n\n⚠️ If vomiting more than 5 times, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto. 🙏`;
      return `Vomiting for 2+ days is serious — risk of severe dehydration 🏥\n\n🚨 Please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto **today**! 🙏`;
    }

    case "diarrhea": {
      const doc = getDoc("gastro");
      const hasCramps = m.includes("cramp") || m.includes("pain") || m.includes("ache");
      if (!isLong) return `${hasCramps ? "Loose motions with cramps sounds like **food poisoning or stomach infection** 🦠" : "Watery stools without pain is usually **mild stomach upset** 💧"}\n\n🌿 **Home Remedies:**\n• **ORS every hour** — most important! Prevents dehydration\n• **BRAT diet** — Banana 🍌, Rice, Applesauce, Toast (bland foods only)\n• Drink **coconut water** to restore electrolytes\n• Avoid: dairy, spicy food, oily food, raw vegetables\n• Drink only **boiled or filtered water**\n\n💊 **Medicines:**\n• **ORS sachets** — must have!\n• **Norflox TZ** — take with food (antibiotic for infection)\n• **Loperamide** (Imodium) — for quick control of loose motions\n• **Yakult** or **probiotics** — helps restore gut bacteria\n\n✅ Should improve in a day! If it continues or you see blood in stools, consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
      return `Loose motions for 2+ days — serious dehydration risk 🏥\n\n🚨 Please book with 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto **immediately**! 🙏`;
    }

    case "backpain": {
      const doc = getDoc("general");
      const isUpper = m.includes("upper") || m.includes("shoulder") || m.includes("neck");
      if (!isLong) return `${isUpper ? "**Upper back pain** is usually from bad posture or muscle strain 😣" : "**Lower back pain** could be from muscle strain, sitting too long, or lifting heavy things 😣"}\n\n🌿 **Home Remedies:**\n• Apply **hot water bag** on the painful area for 15-20 minutes\n• Gentle **stretching exercises** — child's pose, cat-cow stretch\n• Avoid sitting in same position for more than 30 minutes\n• Sleep on a firm mattress on your side with pillow between knees\n• **Turmeric milk** at night reduces inflammation\n\n💊 **Medicines:**\n• **Ibuprofen 400mg** with food — 3 times daily\n• **Combiflam** or **Voveran** gel — apply on painful area\n• **Moov** or **Volini** pain relief spray\n\n✅ Rest for 1-2 days usually helps! If not, consult 👩‍⚕️ **${doc.name}** on Prescripto. 😊`;
      return `Back pain for 2+ days needs attention. Could be **slip disc, sciatica, or kidney issue**.\n\nPlease consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
    }

    case "throat": {
      const doc = getDoc("general");
      const isSwollen = m.includes("swollen") || m.includes("painful") || m.includes("swallow");
      if (!isLong) return `${isSwollen ? "**Swollen painful throat** sounds like tonsillitis or strep throat 😮‍💨" : "**Itchy scratchy throat** is usually allergy or early cold 😮‍💨"}\n\n🌿 **Home Remedies:**\n• **Warm salt water gargle** — 3-4 times daily (most effective!)\n• **Honey + warm water** with a squeeze of lemon — sip slowly\n• **Turmeric milk** at night before sleeping\n• **Ginger tea** with black pepper and honey\n• Suck on **Strepsils** or **Halls** menthol lozenges\n• Avoid cold drinks, ice cream, and speaking loudly\n\n💊 **Medicines:**\n• **Strepsils** lozenges — suck every 3-4 hours\n• **Cetirizine 10mg** at night if allergic\n• **Betadine gargle** solution — very effective for throat infection\n\n✅ Should improve in 2-3 days! If not, consult 👩‍⚕️ **${doc.name}** on Prescripto. 😊`;
      return `Throat pain for 2+ days could be **bacterial infection** needing antibiotics.\n\nPlease consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
    }

    case "fatigue": {
      const doc = getDoc("general");
      if (!isLong) return `Feeling tired and weak could be due to **dehydration, low blood sugar, poor sleep, or anemia** 😔\n\n🌿 **Home Remedies:**\n• Drink **2-3 glasses of water** immediately\n• Have a **banana with peanut butter** or dates for quick energy\n• **Rest for at least 8 hours** tonight\n• **Ashwagandha** powder with warm milk — natural energy booster\n• Avoid skipping meals — eat every 3-4 hours\n\n💊 **Supplements:**\n• **Vitamin B12** supplement if you feel weak often\n• **Iron supplements** if you look pale (possible anemia)\n• **Revital H** multivitamin — once daily with breakfast\n\n✅ If you feel better after rest and food, great! If tiredness persists, consult 👩‍⚕️ **${doc.name}** on Prescripto. 😊`;
      return `Fatigue for 2+ days could be **anemia, thyroid issue, or diabetes**.\n\nPlease get a **blood test (CBC, thyroid)** and consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
    }

    case "eyes": {
      const doc = getDoc("general");
      const isRed = m.includes("red") || m.includes("itch") || m.includes("allerg");
      if (!isLong) return `${isRed ? "**Red itchy eyes** are usually eye allergy or conjunctivitis 👁️" : "**Eye pain with light sensitivity** could be strain or infection 👁️"}\n\n🌿 **Home Remedies:**\n• **Cold compress** — place cold damp cloth on closed eyes for 10 minutes\n• **Rose water** — 2 drops in each eye for soothing\n• Avoid rubbing eyes — it worsens infection\n• Reduce screen time and take eye breaks every 20 minutes\n• Sleep in a dark room\n\n💊 **Medicines:**\n• **Itone eye drops** — natural, safe eye drops\n• **Zaditor** or **Opticrom** eye drops for allergy\n• **Lubricating eye drops** if eyes feel dry\n\n✅ Rest your eyes and apply cold compress. If not better in a day, consult 👩‍⚕️ **${doc.name}** on Prescripto. 😊`;
      return `Eye issues for 2+ days need professional evaluation.\n\nPlease consult 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto! 🙏`;
    }

    case "chest": {
      const doc = getDoc("general");
      return `⚠️ **Chest pain can be a medical emergency!**\n\n🚨 **If the pain is:**\n• Severe and spreading to your arm, jaw, or shoulder\n• With breathlessness or sweating\n• Making you feel dizzy\n\n👉 **Call emergency (112) immediately!**\n\nIf it's mild discomfort:\n• Sit upright and breathe slowly\n• Loosen tight clothing\n• Do NOT take any pain medicine without doctor advice\n\n⚠️ Please visit or book 👩‍⚕️ **${doc.name}** (${doc.speciality}) on Prescripto **urgently**. Chest pain should NEVER be ignored! 🙏`;
    }

    default:
      return `Please consult a doctor for proper diagnosis. You can book with any of our doctors on Prescripto! 😊`;
  }
};

// ============================================
// MAIN CONTROLLER
// ============================================
export const aiChat = async (req, res) => {
  try {
    const { message, userId = "guest" } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    const msg = message.trim();
    const lower = msg.toLowerCase();

    // ✅ Get last state from DB
    const lastChat = await Chat.findOne({ userId }).sort({ createdAt: -1 });
    const step    = lastChat?.step    || null;
    const symptom = lastChat?.symptom || null;
    const dur     = lastChat?.duration || null;

    let reply = "";
    let newStep = null;
    let newSymptom = symptom;
    let newDuration = dur;

    // =====================
    // HANDLE FOLLOW-UP ANSWERS
    // =====================
    if (step === "ask_duration") {
      newDuration = detectDuration(lower);
      newStep = "ask_detail";
      reply = getFollowUpQ(symptom);
    }
    else if (step === "ask_detail") {
      reply = getFinalAdvice(symptom, dur || newDuration, lower);
      newStep = null;
      newSymptom = null;
      newDuration = null;
    }

    // =====================
    // GREETING
    // =====================
    else if (isGreeting(lower)) {
      const timeG = getTimeGreeting();
      reply = `${timeG}! 👋 Welcome to **Prescripto Health Assistant**.\n\nI'm here to help you understand your symptoms and suggest home remedies or the right doctor. 😊\n\nYou can tell me things like:\n• "I have a headache"\n• "I have stomach pain"\n• "I have a cold or cough"\n• "I have fever"\n• "I feel tired"\n• "I have a sore throat"\n\nHow are you feeling today? 💙`;
      newStep = null;
      newSymptom = null;
    }

    // =====================
    // SYMPTOM DETECTION — start flow
    // =====================
    else {
      const detected = detectSymptom(lower);

      if (detected === "chest") {
        // Chest pain — skip follow-up, give immediate advice
        reply = getFinalAdvice("chest", "recent", "");
        newStep = null;
        newSymptom = null;
      }
      else if (detected) {
        newSymptom = detected;
        newStep = "ask_duration";
        const symptomsText = {
          headache: "a headache",
          stomach: "stomach pain",
          cold: "a cold",
          cough: "a cough",
          fever: "fever",
          skin: "a skin issue",
          vomiting: "nausea/vomiting",
          diarrhea: "loose motions",
          backpain: "back pain",
          throat: "a sore throat",
          fatigue: "fatigue/tiredness",
          eyes: "eye discomfort",
        };
        reply = `I'm sorry to hear you have ${symptomsText[detected] || "a health issue"} 😟\n\nLet me help you with that. First — **since when have you been feeling this?**\n\n• Just started today / a few hours ago?\n• Or has it been **more than 2 days**?`;
      }

      // Thank you / done
      else if (lower.includes("thank") || lower.includes("bye") || lower.includes("ok thanks") ||
        lower.includes("got it") || lower.includes("okay") || lower.includes("will do")) {
        reply = "You're welcome! 😊 Take care and stay healthy! 💙\n\nIf your symptoms worsen, don't hesitate to book an appointment with one of our doctors on Prescripto.\n\nGet well soon! 🌟";
        newStep = null;
        newSymptom = null;
      }

      // Unknown
      else {
        reply = "I'm sorry, I didn't quite understand that 😕\n\nCould you describe your symptoms more clearly? For example:\n• 'I have a headache'\n• 'I have stomach pain'\n• 'I feel feverish'\n• 'I have a sore throat'\n\nI'm here to help! 😊";
      }
    }

    // ✅ Save to DB with state
    await Chat.create({
      userId,
      message: msg,
      response: reply,
      step: newStep,
      symptom: newSymptom,
      duration: newDuration,
    });

    return res.json({ reply });

  } catch (error) {
    console.log("AI ERROR:", error);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
};

// ============================================
// CHAT HISTORY
// ============================================
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ data: [] });
    const chats = await Chat.find({ userId }).sort({ createdAt: 1 }).limit(50);
    res.json({ data: chats });
  } catch (error) {
    console.log("History ERROR:", error);
    res.status(500).json({ error: "Error fetching history" });
  }
};