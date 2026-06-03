import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// NOTE: This uses Firebase Admin SDK via service account
// For simplicity, use client SDK approach instead

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { initializeApp: initClientApp } = await import('firebase/app');
  const { getFirestore: getClientFirestore, collection, addDoc, getDocs } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: "AIzaSyBsYJBDE5kDQH2iFE4I1LY0S0xNgO6NT7Q",
    authDomain: "careertest-3a4ad.firebaseapp.com",
    projectId: "careertest-3a4ad",
    storageBucket: "careertest-3a4ad.firebasestorage.app",
    messagingSenderId: "804874192098",
    appId: "1:804874192098:web:fe9105a119c9adcf07cabb"
  };

  const apps = (await import('firebase/app')).getApps();
  const app = apps.length ? apps[0] : initClientApp(firebaseConfig);
  const db = getClientFirestore(app);

  // Check if already seeded
  const existing = await getDocs(collection(db, 'careerTypes'));
  if (existing.size > 0) {
    return res.status(200).json({ message: `Already has ${existing.size} career types. Skipping.` });
  }

  const data = [
    { key:'RI', type:'Realistic-Investigative (RI)', careers:[{t:'Data Scientist / AI Engineer',s:'ကျပ်သိန်း ၁၀-၄၀',m:92},{t:'Software Engineer',s:'ကျပ်သိန်း ၈-၃၀',m:88},{t:'Cybersecurity Analyst',s:'ကျပ်သိန်း ၁၀-၃၀',m:85},{t:'Network Engineer',s:'ကျပ်သိန်း ၅-၂၀',m:80}], majors:['Computer Science','Data Science','AI/ML Engineering'], mm:['Information Technology','Science and Mathematics','Engineering'], mm_uni:['ရန်ကုန် နည်းပညာတက္ကသိုလ်','မန္တလေး နည်းပညာတက္ကသိုလ်','ကွန်ပျူတာတက္ကသိုလ်'], abroad:{japan:['Tokyo Institute of Technology','Osaka University'],sea:['NUS Singapore','Mahidol University'],aus:['University of Melbourne','ANU'],eu:['TU Munich','University of Edinburgh']}, road:['အဆင့် ၁: သင်္ချာ / Physics အခြေခံ ခိုင်မာအောင် လုပ်ပါ','အဆင့် ၂: Python / Programming ၁ နှစ် သင်ကြားပါ','အဆင့် ၃: IELTS/JLPT ကြိုတင်ပြင်ဆင်ပါ','အဆင့် ၄: Internship / Research project တင်ပါ','အဆင့် ၅: AI/Data နယ်ပယ် Specialize လုပ်ပါ'], parent:'သင်္ချာ/သိပ္ပံဝါသနာပါသောကလေးများကို Data Science / IT နယ်ပယ်တွင် အနာဂတ် အလားအလာကောင်းသည်ဟု လေ့လာကြည့်ပါ။' },
    { key:'RE', type:'Realistic-Enterprising (RE)', careers:[{t:'Civil / Structural Engineer',s:'ကျပ်သိန်း ၄-၁၅',m:90},{t:'Project Manager',s:'ကျပ်သိန်း ၅-၂၀',m:85},{t:'Construction Manager',s:'ကျပ်သိန်း ၅-၁၅',m:83},{t:'Petroleum Engineer',s:'ကျပ်သိန်း ၁၀-၃၀',m:80}], majors:['Civil Engineering','Mechanical Engineering','Project Management'], mm:['Engineering','Management and Planning','Trades'], mm_uni:['ရန်ကုန် နည်းပညာတက္ကသိုလ် (RIT)','မန္တလေး နည်းပညာတက္ကသိုလ် (MIT)','ပဲခူး နည်းပညာတက္ကသိုလ်'], abroad:{japan:['Waseda University','Kyushu University'],sea:['UTM Malaysia','KMITL Thailand'],aus:['UNSW','University of Queensland'],eu:['TU Berlin','University of Bath']}, road:['အဆင့် ၁: ရူပဗေဒ / သင်္ချာ ဘာသာရပ်များ ကောင်းမွန်အောင် ပြင်ဆင်ပါ','အဆင့် ၂: Engineering degree (၄-၅ နှစ်) တတ်ပါ','အဆင့် ၃: AutoCAD / BIM software သင်ကြားပါ','အဆင့် ၄: Internship ဖြင့် လက်တွေ့အတွေ့အကြုံ ရယူပါ','အဆင့် ၅: PE License / PMP certificate ရယူပါ'], parent:'အင်ဂျင်နီယာ ကျောင်းသားများသည် မြန်မာနိုင်ငံနှင့် နိုင်ငံတကာတွင် တစ်သမတ်တည်း job market ကောင်းသည်။' },
    { key:'IS', type:'Investigative-Social (IS)', careers:[{t:'Medical Doctor (MBBS)',s:'ကျပ်သိန်း ၈-၅၀+',m:92},{t:'Pharmacist',s:'ကျပ်သိန်း ၅-၁၅',m:87},{t:'Public Health Officer',s:'ကျပ်သိန်း ၃-၁၀',m:84},{t:'Psychologist',s:'ကျပ်သိန်း ၃-၁၅',m:80}], majors:['Medicine (MBBS)','Pharmacy','Public Health','Psychology'], mm:['Health Sciences','Health Support Services','Social Sciences'], mm_uni:['ရန်ကုန် ဆေးတက္ကသိုလ် (UMI)','မန္တလေး ဆေးတက္ကသိုလ် (UM II)','ဆေးဝါးတက္ကသိုလ်'], abroad:{japan:['Tohoku University','Nagoya University'],sea:['Universiti Malaya','Mahidol Med School'],aus:['University of Sydney Medicine','Monash'],eu:['University of Glasgow','Charité Berlin']}, road:['အဆင့် ၁: Biology / Chemistry ဘာသာရပ်များ အထူးပြင်ဆင်ပါ','အဆင့် ၂: MBBS / Pharmacy degree (၅-၆ နှစ်) တတ်ပါ','အဆင့် ၃: Internship / Hospital attachment ပြုလုပ်ပါ','အဆင့် ၄: ကျွမ်းကျင်မှု နယ်ပယ် ရွေးချယ်ပါ','အဆင့် ၅: Research / Publication တင်ပြီး career တက်ပါ'], parent:'ဆရာဝန် / ဆေးဝါးပညာ လမ်းကြောင်းသည် ကြာရှည်သော်လည်း တည်ငြိမ်သော career ဖြစ်သည်။ ကလေး၏ biology / chemistry ကို ပထမဆုံး စစ်ဆေးပါ။' },
    { key:'AE', type:'Artistic-Enterprising (AE)', careers:[{t:'UX/UI Designer',s:'ကျပ်သိန်း ၅-၂၀',m:91},{t:'Marketing Manager',s:'ကျပ်သိန်း ၄-၁၅',m:87},{t:'Content Creator / Media',s:'မူတည် (Variable)',m:83},{t:'Architect',s:'ကျပ်သိန်း ၄-၁၅',m:80}], majors:['Graphic / UX Design','Marketing','Architecture','Mass Communication'], mm:['Applied and Visual Art','Marketing Sales','Performing Arts'], mm_uni:['ရန်ကုန် နည်းပညာတက္ကသိုလ် (Architecture)','ရန်ကုန်တက္ကသိုလ် (Fine Arts)','ပညာရည်ဗောဓိ တက္ကသိုလ်'], abroad:{japan:['Joshibi University','Kyoto Seika University'],sea:['LASALLE Singapore','Assumption University'],aus:['RMIT Melbourne','UTS Sydney'],eu:['UAL London','Aalto University Finland']}, road:['အဆင့် ၁: ကိုယ်ပိုင် portfolio / art work များ စုဆောင်းပါ','အဆင့် ၂: Design degree သို့မဟုတ် Media degree တတ်ပါ','အဆင့် ၃: Figma / Adobe Creative Suite သင်ကြားပါ','အဆင့် ၄: Freelance project ဖြင့် portfolio တည်ဆောက်ပါ','အဆင့် ၅: Design agency / Tech company ဝင်ပါ'], parent:'ဒီဇိုင်းနှင့် creative နယ်ပယ်သည် digital economy တိုးတက်မှုကြောင့် အလားအလာကောင်းလာသည်။' },
    { key:'SE', type:'Social-Enterprising (SE)', careers:[{t:'HR Manager',s:'ကျပ်သိန်း ၄-၁၅',m:89},{t:'Teacher / Lecturer',s:'ကျပ်သိန်း ၂-၈',m:85},{t:'NGO / Development Worker',s:'ကျပ်သိန်း ၂-၈',m:82},{t:'Event Manager',s:'ကျပ်သိန်း ၃-၁၂',m:79}], majors:['Human Resource Management','Education','International Development','Business Administration'], mm:['Education and Support','Social Sciences','Management and Planning'], mm_uni:['ရန်ကုန်တက္ကသိုလ် (Arts)','မြောက်ဦးတက္ကသိုလ်','မဟာမြတ်မုနိ တက္ကသိုလ်'], abroad:{japan:['Waseda University','Ritsumeikan APU'],sea:['NUS (Sociology)','Thammasat Thailand'],aus:['University of Sydney','Monash Arts'],eu:['University of Edinburgh','Kings College London']}, road:['အဆင့် ၁: Communication / Leadership skill တိုးမြှင့်ပါ','အဆင့် ၂: HRM / Business / Education degree တတ်ပါ','အဆင့် ၃: Volunteer / NGO experience ရယူပါ','အဆင့် ၄: IELTS / TOEFL ၇.၀+ ရောက်အောင် ပြင်ဆင်ပါ','အဆင့် ၅: HR Certification (SHRM/CIPD) ရယူပါ'], parent:'လူနှင့် ဆက်ဆံရေးကောင်းသောကလေးများ HR / Education / NGO နယ်ပယ်တွင် ကျေနပ်မှုနှင့် ဝင်ငွေ ဟန်ချက်ညီ ရနိုင်သည်။' },
    { key:'EC', type:'Enterprising-Conventional (EC)', careers:[{t:'Investment Banker',s:'ကျပ်သိန်း ၁၀-၅၀+',m:91},{t:'Lawyer / Legal Counsel',s:'ကျပ်သိန်း ၅-၅၀+',m:88},{t:'Business Manager / CEO',s:'ကျပ်သိန်း ၁၀-၁၀၀+',m:86},{t:'Financial Analyst',s:'ကျပ်သိန်း ၅-၂၅',m:83}], majors:['Finance / Economics','Law (LLB)','Business Administration','MBA'], mm:['Finance','Law','Management and Planning'], mm_uni:['ရန်ကုန်တက္ကသိုလ် (Economics)','ဥပဒေပညာတက္ကသိုလ်','Myanmar German Technical Institute'], abroad:{japan:['Hitotsubashi University','Keio Business'],sea:['NUS Business','Nanyang Business School'],aus:['University of Melbourne Law','UNSW Business'],eu:['LSE London','University of Edinburgh Law']}, road:['အဆင့် ၁: Economics / Accounting / Law ဘာသာများ ပြင်ဆင်ပါ','အဆင့် ၂: BBA / LLB / Finance degree တတ်ပါ','အဆင့် ၃: CFA / ACCA / Bar exam certificate ရည်မှန်းပါ','အဆင့် ၄: Internship at bank / law firm ဝင်ပါ','အဆင့် ၅: MBA ဖြင့် career တက်ပါ'], parent:'စီးပွားရေး / ဥပဒေ နယ်ပယ်သည် မြင့်မားသော ဝင်ငွေ ရရှိနိုင်သော်လည်း ကြာရှည်သော ပညာသင်ကာလ လိုအပ်သည်။' },
    { key:'SC', type:'Social-Conventional (SC)', careers:[{t:'Accountant / CPA',s:'ကျပ်သိန်း ၃-၁၂',m:89},{t:'Government Civil Servant',s:'ကျပ်သိန်း ၂-၆',m:82},{t:'Bank Officer',s:'ကျပ်သိန်း ၃-၁၀',m:80},{t:'Social Worker',s:'ကျပ်သိန်း ၂-၆',m:77}], majors:['Accounting','Public Administration','Banking','Social Work'], mm:['Clerical and Secretarial','Finance','Education and Support'], mm_uni:['စီးပွားရေးတက္ကသိုလ် (UBE)','ရန်ကုန်တက္ကသိုလ် (Economics)','ဘဏ္ဍာရေးတက္ကသိုလ်'], abroad:{japan:['Rikkyo University','Meiji University'],sea:['University of Malaya','Chulalongkorn'],aus:['Griffith University','Deakin University'],eu:['University of Glasgow','Vrije Universiteit']}, road:['အဆင့် ၁: Accounting / Math ဘာသာ ကောင်းကောင်းတတ်ပါ','အဆင့် ၂: B.Accounting / Public Admin degree တတ်ပါ','အဆင့် ၃: ACCA / CPA မော်ဂျူးများ ဆက်လုပ်ပါ','အဆင့် ၄: Bank / Government ဌာနတွင် entry-level ဝင်ပါ','အဆင့် ၅: Senior role / Management တက်ပါ'], parent:'တည်ငြိမ်သော career ကို ဦးစားပေးသောကလေးများအတွက် Government / Banking နယ်ပယ်သည် ကောင်းသောရွေးချယ်မှုဖြစ်သည်။' },
    { key:'AC', type:'Artistic-Conventional (AC)', careers:[{t:'Graphic / Motion Designer',s:'ကျပ်သိန်း ၂-၁၀',m:90},{t:'Animator / 3D Artist',s:'ကျပ်သိန်း ၃-၁၅',m:87},{t:'Game Developer',s:'ကျပ်သိန်း ၅-၂၅',m:84},{t:'Interior Designer',s:'ကျပ်သိန်း ၃-၁၂',m:80}], majors:['Graphic Design','Animation / Digital Arts','Game Design','Interior Design'], mm:['Applied and Visual Art','Crafts','Information Technology'], mm_uni:['ရန်ကုန် နည်းပညာတက္ကသိုလ် (Architecture/Design)','ရန်ကုန်တက္ကသိုလ် (Fine Arts)','ထူးချွန် တက္ကသိုလ်'], abroad:{japan:['Tokyo University of Arts','Digital Hollywood'],sea:['LASALLE Singapore','RMIT Vietnam'],aus:['RMIT Melbourne','Billy Blue Design'],eu:['Central Saint Martins London','Design Akademie Berlin']}, road:['အဆင့် ၁: Art / Design portfolio ဖန်တီးမည်','အဆင့် ၂: Design / Animation degree တတ်ပါ','အဆင့် ၃: Adobe Suite / 3D tools (Blender/Maya) သင်ပါ','အဆင့် ၄: Freelance / Client project ဖြင့် portfolio ကြီးမားအောင် ဆောင်ရွက်ပါ','အဆင့် ၅: Game studio / Design agency ဝင်ပါ'], parent:'ဖန်တီးမှု နယ်ပယ်သည် Korea / Japan တွင် အလုပ်ရနိုင်မှု ကောင်းသည်။ ကလေး၏ portfolio ကို ပညာသင်နှစ်အတွင်း တည်ဆောက်ရန် အထောက်အပံ့ပေးပါ။' }
  ];

  let count = 0;
  for (const d of data) {
    await addDoc(collection(db, 'careerTypes'), { ...d, updatedAt: Date.now() });
    count++;
  }

  return res.status(200).json({ success: true, message: `${count} career types seeded successfully!` });
}
