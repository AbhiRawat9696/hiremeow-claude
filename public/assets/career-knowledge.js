export const REVIEWED = '14 September 2026';
export const SOURCES = {
 ed: ['Thai Embassy — ED and ED Plus', 'https://vientiane.thaiembassy.org/en/page/non-ed-visa-2'],
 edplus: ['Thai Embassy — ED Plus eligibility', 'https://brussels.thaiembassy.org/en/page/non-immigrant-visa-ed-plus'],
 measures: ['Thai Embassy — new visa measures', 'https://washingtondc.thaiembassy.org/en/page/new-visa-measuresjul24'],
 nonb: ['MFA — Non-Immigrant B', 'https://www.mfa.go.th/en/page/non-immigrant-visa-b'],
 docs: ['Thai Consulate — employment documents', 'https://savannakhet.thaiembassy.org/th/publicservice/non-immigrant-visa-b-employment?cate=5d849c1415e39c26b4003bc0'],
 work: ['Department of Employment — foreign-worker law', 'https://www.doe.go.th/prd/alien/law/param/site/152/cat/5/sub/0/pull/module/view/list-label'],
 fees: ['Department of Employment — published permit fees', 'https://www.doe.go.th/prd/download/download_by_pool_file/62500'],
 smart: ['BOI — SMART rules, announcement Por. 5/2568', 'https://smart-visa.boi.go.th/smart/document/related/Announcement_of_the_Office_of_the_Board_of_Investment_No_Por_5_2568_EN.pdf'],
 smarts: ['BOI — SMART S requirements', 'https://smart-visa.boi.go.th/smart/pages/smart_s.html'],
 ltr: ['BOI — LTR programme', 'https://ltr.boi.go.th/'],
 ltrfaq: ['BOI — LTR questions and work conditions', 'https://ltr.boi.go.th/page/faq.html'],
 boi: ['BOI — approval of foreign experts', 'https://www.boi.go.th/index.php?language=en&page=procedures_experts'],
 restricted: ['Thai Government — restricted occupations', 'https://thailand.go.th/public/issue-focus-detail/007-010'],
 dbd: ['Department of Business Development — company registry', 'https://datawarehouse2.dbd.go.th/bdw/home/main.html'],
 immigration: ['Thai Immigration Bureau', 'https://www.immigration.go.th/'],
 evisa: ['Official Thai e-Visa portal', 'https://www.thaievisa.go.th/']
};
const entry = (id, category, question, aliases, paragraphs, sources = [], action = null) => ({id, category, question, aliases, paragraphs, sources, action});
export const QUESTIONS = [
 entry(1,'Visas & graduation',"I’m an international student in Thailand. What are my options for staying and working here after graduation?",['after graduation options','graduate stay work','finished university next steps','post graduation routes'],[
 'Start with your university visa office before your current permission to stay ends. Ask whether your degree and immigration status qualify for ED Plus post-graduation permission. Eligible graduates can apply for a one-year stay to look for work; it is not automatic permission to work.',
 'With a qualifying Thai job offer, the usual route is employer-supported Non-B status and work authorisation. LTR has separate, demanding category requirements. SMART is now focused on qualifying startup founders and dependants, not a general fresh-graduate work route.',
 'Your degree level, graduation date, current stamp and job-offer status determine the next step. Share those details without passport numbers.'
 ],['edplus','nonb','smart']),
 entry(2,'Visas & graduation','What is the difference between an ED, ED Plus, Non-B, SMART, and LTR visa?',['compare visas','visa types difference','ed vs ed plus','smart visa','ltr visa'],[
 'ED: permission for education and specified training. ED Plus: for eligible university students at bachelor’s level or higher, with a post-graduation job-search extension route. Neither is a general work permit.',
 'Non-B: a business/employment visa category. Employment normally also needs work authorisation.',
 'SMART: the 2025 BOI rules narrowed new applications to qualifying established startup entrepreneurs (SMART S) and dependants. Older Talent/Investor/Executive webpages should not be treated as current entry routes.',
 'LTR: a long-term programme for qualifying wealthy individuals, pensioners, overseas remote professionals and highly skilled professionals. It offers up to ten years subject to conditions, not permanent residence. Thai employment and overseas remote work have different work-authorisation rules.'
 ],['ed','smart','ltrfaq']),
 entry(3,'Visas & graduation','Am I eligible for an ED Plus visa, and how do I apply?',['ed plus eligibility','apply ed+','qualify ed plus','bachelors masters phd education plus'],[
 'ED Plus is aimed at international students enrolled in a Thai university/institution at bachelor’s degree level or higher. Do not assume a language course, certificate or exchange programme qualifies; ask your university to confirm your programme and current status.',
 'During study, the institution handles extensions on the student’s behalf. Ask its visa office which initial-visa or in-country process applies. For graduate permission, request the institution’s graduation confirmation and local Immigration checklist before your current stay expires.',
 'Common supporting items include passport/stay records, a recent photo, university letters and financial evidence. The exact checklist depends on where you apply; a graduation ceremony alone does not extend your stay.'
 ],['edplus','evisa']),
 entry(4,'Visas & graduation','Can I stay in Thailand to look for a job after I graduate, and for how long?',['how long after graduating','job search one year','12 months graduate','stay after finish degree'],[
 'Eligible ED Plus graduates may apply to extend their stay for one year after graduation to seek employment or undertake other permitted activities. This is not an automatic extra year for everyone holding an ED visa.',
 'Have your university and Immigration confirm the application deadline, graduation evidence, start date and permitted-until date. Continue to follow your actual permission-to-stay stamp while the application is being arranged. Job searching does not itself authorise starting employment.'
 ],['ed','work']),
 entry(5,'Visas & graduation','My student visa expires soon. What should I do if I haven’t found a job yet?',['visa expiring soon','expires tomorrow','overstay','expired student visa','no job visa ending','expiry deadline'],[
 'Contact your university visa office and your local Immigration office now. Check the permitted-until date in your passport, which may differ from the visa sticker’s validity. If it has already passed, seek case-specific guidance immediately.',
 'Ask whether you qualify for an ED Plus graduate extension, continued-study extension, another lawful status, or need to depart by your deadline. Do not assume that a pending job application or university appointment grants extra stay.',
 'Prepare your current visa/stay records and graduation or enrolment confirmation for the officials. Do not post those documents in this chat. I cannot grant an extension or calculate a safe grace period.'
 ],['edplus','immigration']),
 entry(6,'Work permission','Can I work part-time while studying in Thailand?',['part time student','20 hours work','weekend job studying','student allowed work','work on ed'],[
 'An ED or ED Plus student status does not by itself authorise part-time employment. Do not assume a student-hours allowance like those used in some other countries.',
 'Before taking a paid job, ask the Department of Employment and your university whether your precise activity needs a work permit and whether you must change immigration status. An employer’s verbal permission is insufficient. A curricular placement needs its own assessment; see the internship question.'
 ],['work','ed']),
 entry(7,'Work permission','Do I need a work permit for a paid or unpaid internship?',['unpaid internship permit','paid internship legal','curricular placement','intern work permit','volunteer internship'],[
 'Payment alone does not determine whether an activity counts as work. An unpaid placement is not automatically exempt from work-permit rules.',
 'An internship that forms part of an academic curriculum can fit an education-visa purpose, while a paid or non-curricular placement may need a different route. Visa eligibility and work-permit exemption are separate questions.',
 'Before starting, have the university and host describe the duties, hours, payment, dates and curriculum requirement to the Department of Employment and Immigration. Obtain their confirmation of the correct permission for that specific placement.'
 ],['ed','work']),
 entry(8,'Work permission','I received a job offer. How do I change from a student visa to a work visa?',['got job offer change visa','switch ed to non b','student to work visa','convert student visa'],[
 'Ask HR for the signed offer and its sponsorship plan. Coordinate the end of your study-based permission with your university, and ask Immigration which transition procedure applies before anything is cancelled.',
 'Eligible ED Plus holders who find employment can apply to change visa type in Thailand. Other situations must be assessed individually. HR should prepare the employer documents and any Department of Employment or BOI approval required for the route.',
 'Keep permission to stay valid throughout the transition and obtain the necessary work authorisation before you begin. A job offer, visa application receipt or Non-B visa alone is not enough to start work.'
 ],['ed','docs','nonb']),
 entry(9,'Work permission','Can I change my visa inside Thailand, or do I need to leave the country?',['in country visa change','must leave thailand','visa run','change without leaving','convert inside thailand'],[
 'Sometimes an in-country process is available. ED Plus explicitly provides a route to apply for a different visa type after finding employment. Do not assume every ED holder or every visa category has the same option.',
 'The answer depends on your current permission, remaining days, nationality, employer paperwork and the local office’s procedure. Ask Immigration to confirm the route and deadline before cancelling your current status or booking travel.',
 'If an overseas application is required, confirm that the relevant Thai embassy accepts applications from someone in your residence situation. Do not rely on a border trip as a guaranteed solution.'
 ],['edplus','nonb','evisa']),
 entry(10,'Work permission','What documents do my employer and I need for a Non-B visa and work permit?',['documents checklist work visa','paperwork non b','what docs needed','wp32 wp3 wp1','employer documents'],[
 'Your side: passport and current stay records, application/photo, signed employment terms, and qualifications or experience evidence. A medical certificate or professional licence may be needed for the work-permit stage.',
 'Employer side: signed support letter stating the job, salary and contract term; company registration, shareholders and business details; relevant tax/financial records; and the applicable labour pre-approval (for example WP32) or BOI approval.',
 'Visa and work-permit applications have separate checklists. Ask HR for the current checklist from the actual embassy, Immigration office and Department of Employment. BOI and regulated professions can have different requirements.'
 ],['docs','work']),
 entry(11,'Work permission','How much do the visa and work permit applications cost, and who usually pays?',['fees cost price','how much visa','who pays work permit','application charges','pay visa employer'],[
 'Published reference fees for a Non-B visa are THB 2,000 for single entry and THB 5,000 for multiple entry where available. Embassy fees may be collected in local currency; check the issuing mission’s current schedule.',
 'The Department of Employment publishes a THB 100 application fee and permit fees of THB 750 (up to 3 months), THB 1,500 (over 3–6 months), or THB 3,000 (over 6–12 months). Verify that this schedule applies to your route; extensions, re-entry, translations and service fees are separate.',
 'There is no single payment arrangement I can promise. Ask HR to itemise government charges and agent fees, say who pays each, and put reimbursement terms in writing before you accept.'
 ],['nonb','fees']),
 entry(12,'Work permission','How long does the visa and work permit process take, and when can I legally start working?',['processing time','when start work','how many days permit','pending application work','start before permit'],[
 'There is no reliable universal total. Employer document preparation, labour/BOI endorsement, visa issuance or conversion, and work authorisation are separate stages. Missing documents or appointments can extend the process.',
 'Ask HR for a schedule confirmed with the relevant offices and make the start date conditional on authorisation. Allow time before your current stay ends; a submission receipt does not automatically extend it.',
 'For ordinary employment, start only once the necessary work authorisation and immigration permission are in place. Any statutory exemption must actually apply to you and your activity; being unpaid or on probation is not a general exemption.'
 ],['nonb','work']),
 entry(13,'Work permission','Can I do freelance or remote work for an overseas company while studying in Thailand?',['freelance remote overseas','work from laptop foreign company','digital nomad student','online job foreign clients','remote work ed'],[
 'Do not assume that overseas clients or payment to a foreign bank make work performed in Thailand permissible on student status. ED and ED Plus do not provide a general freelance or remote-work entitlement.',
 'Ask Immigration and the Department of Employment about your actual activity before starting. Separate routes such as DTV or LTR Work-from-Thailand may be relevant if you satisfy their conditions; they are not automatic add-ons to ED.',
 'LTR Work-from-Thailand is for qualifying overseas remote employment and does not authorise income-generating employment with Thai employers under that category. Tax obligations need separate advice.'
 ],['work','measures','ltrfaq']),
 entry(14,'Work permission','What happens to my visa and work permit if I change jobs, resign, or lose my job?',['resign fired laid off','lost job visa','termination change employer','switch jobs cancel permit'],[
 'Treat a job change or termination as an immigration and work-authorisation event, not just an HR change. Employment-based permission may depend on the sponsoring role, so the printed end date is not a guarantee you can remain after that employment ends.',
 'Coordinate old-employer notifications, any cancellation, new-employer applications and Immigration arrangements before the final working day where possible. Ask the Department of Employment what notice or new permission your route requires.',
 'Do not assume a universal grace period or that a permit transfers automatically. BOI, SMART, LTR and ordinary employment routes have different procedures; request written, case-specific instructions.'
 ],['work','boi','immigration']),
 entry(15,'Visas & graduation','Where can I confirm the latest visa rules and get help with my specific situation?',['official help latest rules','contact immigration','where confirm rules','visa office sources','talk to adviser'],[
 'For your current stay and an in-country change, contact the Immigration office responsible for your address. For overseas visa issuance, use the official Thai e-Visa portal and the issuing Thai embassy or consulate.',
 'For work permission and restricted duties, ask the Department of Employment. For BOI, SMART or LTR eligibility, contact the relevant BOI unit. Your university’s international/visa office should help with enrolment or graduation evidence.',
 'These answers are a reviewed library, not a live legal assessment. Check the linked source and responsible office before acting. You do not need to share passport numbers, financial statements or other sensitive documents here.'
 ],['immigration','evisa','work','ltr']),
 entry(16,'Jobs & employers','How can I find employers in Thailand that hire international graduates and sponsor work permits?',['find sponsor employers','companies hire foreigners','jobs international graduates','where find sponsored jobs'],[
 'Use the BOI Employer Directory as a starting list, then confirm openings on each employer’s own careers page. Search for graduate, junior, associate or trainee roles aligned with your skills, and ask your university careers office about employer partnerships.',
 'Check each vacancy’s language, experience and work-authorisation requirements. Ask HR whether it supports your specific position and immigration situation. An employer appearing in this directory is not a promise of a current vacancy or sponsorship.',
 'Track the role link, application deadline, HR contact and written sponsorship answer so you can focus on eligible opportunities.'
 ],['boi'], 'employers'),
 entry(17,'Jobs & employers','What is a BOI-promoted company, and does BOI status mean it will sponsor foreign workers?',['what is boi','boi promotion sponsorship guaranteed','board of investment company','boi means sponsor'],[
 'A BOI-promoted company has an investment project approved for specified incentives. Those privileges may include a process for bringing in foreign experts for approved positions.',
 'BOI promotion does not mean every role is approved for a foreign worker or that the company will sponsor you. Position approval and approval to place a particular person are separate steps.',
 'Ask HR which Thai legal entity would employ you, whether the role belongs to its promoted project, and which approval route it will use. Confirm the offer directly with that entity.'
 ],['boi']),
 entry(18,'Jobs & employers','How can I check whether a job listing or an employer’s sponsorship offer is legitimate?',['scam fake employer','legitimate job offer','verify company sponsor','recruitment fraud','check job listing'],[
 'Look up the exact legal entity and registration number in the Department of Business Development registry. Registration establishes that an entity exists; it does not guarantee that a recruiter or offer is genuine.',
 'Find the role on the employer’s official website and contact HR through independently obtained contact details. Confirm the job duties, salary, location, employing entity and sponsorship process in writing.',
 'Be cautious with guaranteed-visa claims, personal-bank payments, pressure to send identity documents, or requests to work before authorisation. Ask the Department of Employment to confirm a recruiter’s licence or a proposed work-permit process.'
 ],['dbd','work']),
 entry(19,'Jobs & employers','Which jobs or occupations are restricted for foreigners in Thailand?',['prohibited restricted occupations','jobs foreigners cannot do','tour guide hairdresser','forbidden professions'],[
 'Thailand has both prohibited occupations and work permitted only under specified conditions. Examples of strictly restricted work listed by the government include tour guiding, Thai massage, hairdressing/beauty treatment and clerical or secretarial work.',
 'Other categories, including some professional work, have conditions, treaty exceptions or licensing requirements. This short answer is not the complete list.',
 'Ask the Department of Employment to check the actual duties and your circumstances against the current notification. A different job title, an unpaid arrangement or BOI promotion does not by itself remove a restriction.'
 ],['restricted','work']),
 entry(20,'Jobs & employers','Can I get a job in Thailand if I don’t speak Thai?',['no thai language','english only jobs','dont speak thai','thai fluency necessary'],[
 'Some roles use English or another international working language, but there is no guarantee a particular employer will accept applicants without Thai. Use the language requirement in the actual vacancy as your guide.',
 'Focus your search on teams serving international customers or operating across countries, then confirm the language used in interviews and daily work. List your language levels honestly and show role-specific skills or projects.',
 'Thai study can widen your options. Language fit and visa sponsorship are separate checks: an English-language vacancy may still require existing work authorisation.'
 ],[], 'employers'),
 entry(21,'Jobs & employers','Which employers hire international graduates in my field of study?',['employers my major field','computer science employers','engineering companies','business graduate companies','which company my degree'],[
 'Use your field to narrow the directory, then verify individual vacancies: computing/data → software and digital roles; engineering → electronics, manufacturing or automation; business → operations, international sales or supply-chain roles.',
 'These are search directions, not verified job openings or sponsorship promises. The directory is a saved set of company records, not a live hiring feed.',
 'Share your major, strongest skills, preferred city and working languages when speaking to your careers adviser or HR. Open the employer directory to filter and check companies directly.'
 ],[], 'employers'),
 entry(22,'Jobs & employers','Can I get a sponsored job as a fresh graduate with little or no work experience?',['fresh graduate no experience','entry level sponsorship','junior work visa','first job sponsorship'],[
 'It may be possible, but sponsorship depends on the employer, approved duties and your qualifications. A degree alone does not guarantee a sponsored role, and some expert routes have additional criteria.',
 'Target roles explicitly marked graduate, junior, trainee or associate. Demonstrate relevant coursework, internships, capstone projects and language or technical skills with concrete examples.',
 'Ask HR early whether the position is open to a foreign fresh graduate and whether it can support the necessary permission. Do not assume BOI status waives individual requirements.'
 ],['boi'], 'employers'),
 entry(23,'Jobs & employers','How can I find internships that could lead to a full-time job and visa sponsorship?',['internship to full time','internship leads sponsorship','find internship placement','convert intern employee'],[
 'Start with your university’s placement office, partner employers and companies’ own internship pages. Prioritise a placement with a named supervisor, real learning objectives and work relevant to your intended graduate role.',
 'Before accepting, ask whether the internship has a graduate hiring pathway, when conversion decisions happen and whether HR supports foreign graduate hires. Get the internship terms and any future-job conditions in writing; conversion is never guaranteed.',
 'Check permission for the internship itself before you start. Paid and unpaid placements can raise work-authorisation questions; do not wait for a full-time offer to resolve them.'
 ],['ed','work'], 'employers'),
 entry(24,'Jobs & employers','When and how should I ask an employer whether they can sponsor my visa and work permit?',['ask hr sponsor','when mention visa','sponsorship email wording','tell recruiter permit'],[
 'Raise it during the first recruiter conversation or when the application asks about work authorisation. Resolve it before you accept an offer or agree to a start date.',
 'You can say: “I am completing my degree in Thailand and currently hold student permission. Does this role support the necessary visa transition and work authorisation for an international graduate? Who manages the process and fees?”',
 'At offer stage, request the employing entity, intended route, document responsibilities, fees and realistic start-date conditions in writing. Describe your current status accurately; do not claim unrestricted work rights.'
 ]),
 entry(25,'Jobs & employers','What salary should I expect as an international graduate, and are there salary requirements for my visa?',['salary expectations minimum','how much earn fresh graduate','minimum salary visa','pay threshold nationality','salary requirements'],[
 'There is no single salary range for all international graduates. Compare current roles with the same duties, location, experience level and language needs; ask HR for the budgeted gross monthly range and benefits. This library has no live salary database, so I won’t invent a market figure.',
 'Salary conditions for immigration permission are separate from market pay. They can vary by route, occupation, nationality and employer privileges; BOI and LTR have their own conditions. A number on an offer does not establish eligibility.',
 'Ask HR to identify the exact rule applying to your case and verify it with the responsible office before accepting an offer dependent on sponsorship.'
 ],['immigration','boi','ltr']),
 entry(26,'Resumes & interviews','What should I include in a resume when applying for jobs in Thailand?',['resume include sections','cv format content','write resume thailand','resume tips'],[
 'Use a clear, tailored resume with contact details, a brief role-focused summary, education and graduation date, relevant experience or projects, skills, and honest language levels. Add a portfolio link where useful.',
 'For a fresh graduate, explain the tools you used, your contribution and the outcome of projects. Use measurable results where you have them, without inventing numbers. Match the job description’s relevant terminology naturally.',
 'A practical starting point is one or two readable pages. State work-authorisation needs accurately if requested. Leave passport/ID numbers, bank details and sensitive documents out of the resume.'
 ],[], 'resume'),
 entry(27,'Resumes & interviews','Should my resume be in English or Thai, and should I include a photo, nationality, or visa status?',['resume english thai photo','photo nationality cv','include visa status resume','resume language'],[
 'Follow the vacancy’s requested language. Use English for an English-language role; provide a carefully checked Thai version when requested and when it accurately reflects your ability. Do not imply fluency you do not have.',
 'A photo is not a universal requirement. Include one only if you choose to or the employer reasonably requests it. You can usually omit age, marital status, religion, full address and passport numbers.',
 'Where relevant, state your current work-authorisation situation and sponsorship need briefly and truthfully. Share nationality or identity evidence through the employer’s verified process when necessary for immigration checks, rather than putting identity documents in the resume.'
 ],[], 'resume'),
 entry(28,'Resumes & interviews','Can you review my resume against a job description and suggest improvements?',['review my resume job description','compare cv jd','analyse resume match','improve resume fit'],[
 'Yes—this version can run a basic keyword and structure comparison locally in your browser. It is a checklist aid, not an AI assessment of suitability or a hiring score.',
 'In one message, paste your redacted text in this format: “Resume: [your resume]” followed by “Job description: [the vacancy]”. I will identify listed skills missing from the resume and suggest ways to show relevant evidence. Add only skills you actually have.',
 'Remove names, contact details, passport numbers and confidential employer information first. For the existing Thailand-focused checks, open Resume Feedback.'
 ],[], 'resume'),
 entry(29,'Resumes & interviews','How should I prepare for an interview with a Thai employer, especially questions about sponsorship?',['interview preparation sponsorship','interview thai employer','recruiter questions visa','prepare interview'],[
 'Prepare a concise introduction, examples of relevant work and a clear explanation of why this role interests you. Structure examples around the situation, what you did and the result. Research the actual employer and practise in the advertised working language.',
 'For sponsorship, explain your current status, graduation timing and need for work authorisation accurately. Ask who manages the process, who pays and how the start date depends on approval.',
 'Bring role-specific questions and avoid promising you can start immediately if permission is unresolved. Send a brief follow-up highlighting your fit and any agreed next steps.'
 ]),
 entry(30,'Privacy','How do you use and protect my resume and personal information, and can I request their deletion?',['privacy personal data deletion','delete my information','resume storage protect','pdpa data','store chat history'],[
 'Saved guidance and the separate resume checker run in your browser. When live AI is connected, HireMeow sends your question and up to ten recent messages to OpenAI to generate an answer. With web search enabled, generated queries also go to search providers. Turn search off when reviewing personal text; avoid sharing sensitive documents.',
 'HireMeow does not save a conversation database. Live requests use store:false, but provider retention may still apply. Use “Clear chat” to remove this page’s conversation and draft. It does not delete provider records. The separate resume checker has its own reset control; downloaded files remain on your device until deleted.',
 'The website host and external assets may process ordinary access information, including IP addresses. These records are outside this chat’s clear function. For OpenAI data rights and deletion requests, visit privacy.openai.com and read its privacy policy. HireMeow cannot confirm deletion from a provider on your behalf.'
 ])
];

const STOP = new Set('i im me my we our you your a an the is are am was be been being can could should would do does did have has had how what which when where who why and or of to in on at for from by as with that this it its if then than while about here there need want please thailand thai international student students visa work working job jobs'.split(' '));
export function normalize(text) {
 return String(text).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/ed\s*\+/g,'ed plus').replace(/non[\s-]*b/g,'non b').replace(/\bcv\b/g,'resume').replace(/\b(?:parttime|part-time)\b/g,'part time').replace(/\b(?:costs|prices|charges)\b/g,'fees').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}
function tokens(text) {return [...new Set(normalize(text).split(' ').filter(x=>x.length>1&&!STOP.has(x)).map(x=>x.length>5?x.replace(/(?:ing|ed|s)$/,''):x))];}
const documents = QUESTIONS.map(q=>({q, texts:[q.question,...q.aliases].map(normalize), words:tokens([q.question,...q.aliases].join(' '))}));
const weights = new Map();
for(const {words} of documents)for(const word of words) weights.set(word,(weights.get(word)||0)+1);
const idf = word=>1+Math.log(31/(1+(weights.get(word)||0)));
const rules = [
 [30,/\b(privacy|pdpa|personal (?:data|information)|data (?:deletion|protection)|delete (?:my|the) (?:data|information|history)|store (?:my|the) (?:resume|data|chat)|train.*(?:data|resume))\b/],
 [27,/\b(photo|nationality|visa status)\b.*\b(resume|include)\b|\bresume\b.*\b(photo|nationality|visa status|english or thai|language)\b/],
 [28,/\b(review|compare|check|analyse|analyze|match)\b.*\b(resume|job description|jd)\b|\bresume\b.*\b(job description|review|improve|jd)\b/],
 [29,/\binterview\b/], [18,/\b(scam|fake|fraud|legitimate|legit|verify employer|verify company)\b/],
 [19,/\b(prohibited|restricted|forbidden|banned|tour guide|hairdress|massage)\b/],
 [14,/\b(resign|resignation|fired|laid off|lose my job|lost my job|change jobs|change employer|termination|redundant)\b/],
 [5,/\b(expir\w*|overstay|deadline|ends? tomorrow|ending soon)\b/],
 [13,/\b(freelanc\w*|remote|overseas company|foreign clients|online job|digital nomad)\b/],
 [7,/\bintern\w*\b.*\b(permit|paid|unpaid|legal|permission)\b|\b(paid|unpaid|curricular)\b.*\bintern\w*\b/],
 [23,/\bintern\w*\b.*\b(find|sponsor|full time|lead)\b|\bfind\b.*\bintern\w*\b/],
 [6,/\b(part time|weekend job|20 hours|work on ed|work while studying)\b/],
 [11,/\b(fee|fees|cost|price|costing|who pays|how much.*(?:visa|permit)|pay for.*(?:visa|permit))\b/],
 [25,/\b(salary|salaries|earn|pay threshold|minimum income|remuneration)\b/],
 [10,/\b(documents?|paperwork|checklist|wp32|wp3|wp1)\b/],
 [12,/\b(processing|process take|how long.*process|when.*start work|start.*before.*permit|pending application)\b/],
 [9,/\b(leave the country|leave thailand|inside thailand|in country|visa run|without leaving|border trip)\b/],
 [8,/\b(job offer|switch.*ed|convert.*student|student to work|change.*student.*work)\b/],
 [3,/\bed plus\b.*\b(eligible|eligibility|apply|application|qualify)\b|\b(eligible|apply|qualify)\b.*\bed plus\b/],
 [2,/\b(difference|compare|versus|vs|types)\b.*\bvisa\b|\bvisa\b.*\b(difference|types)\b/],
 [4,/\b(how long|one year|12 months|stay.*look|stay.*search)\b.*\b(graduat\w*|job)\b/],
 [1,/\b(after graduat\w*|post graduation|finished university|finish my degree)\b/],
 [24,/\b(ask|tell|mention)\b.*\b(sponsor\w*|recruiter|hr|employer)\b/],
 [17,/\b(what is|what does|mean|status|guarantee\w*)\b.*\bboi\b|\bboi\b.*\b(mean|guarantee\w*|status)\b/],
 [22,/\b(fresh graduat\w*|no experience|little experience|entry level|first job|junior)\b/],
 [20,/\b(don t speak thai|no thai|english only|without thai|can t speak thai|thai fluency)\b/],
 [21,/\b(my field|my major|my degree|field of study|computer science|engineering|business graduate)\b/],
 [16,/\b(find|hire|hiring|search)\b.*\b(employer\w*|compan\w*|sponsor\w*|job\w*)\b/],
 [15,/\b(official|latest rules|confirm.*rules|visa office|contact immigration|specific situation)\b/],
 [26,/\b(resume|curriculum vitae)\b/]
];
export function matchQuestion(input, previousId=null) {
 const query=normalize(input); if(!query)return null;
 const exact=documents.find(d=>normalize(d.q.question)===query);if(exact)return {item:exact.q, confidence:1};
 if(/^(hi|hello|hey|thanks|thank you)$/.test(query))return null;
 // Avoid turning a generic one-word query into a confident legal answer.
 const special = { 'ed plus':3, smart:2, 'smart visa':2, ltr:2, 'ltr visa':2, privacy:30, 'visa fees':11, fees:11, resume:26, 'work permit':10, internship:7 };
 if(special[query])return {item:QUESTIONS[special[query]-1],confidence:1};
 // Explicit visa comparisons and ED Plus application documents beat broad keyword rules.
 if(/\b(difference|compare|versus|vs)\b/.test(query)&&/\b(ed|non b|ltr|smart)\b/.test(query))return {item:QUESTIONS[1],confidence:.95};
 if(/\bed plus\b/.test(query)&&/\b(documents?|paperwork|apply|eligible|qualify|application)\b/.test(query)&&!/\b(expir\w*|work|internship)\b/.test(query))return {item:QUESTIONS[2],confidence:.95};
 for(const [id,pattern] of rules)if(pattern.test(query))return {item:QUESTIONS[id-1],confidence:.95};
 if(previousId&&/^(tell me more|more details|explain more|what about that)$/.test(query))return {item:QUESTIONS[previousId-1],confidence:.9};
 const words=tokens(query);if(!words.length)return null;
 const ranked=documents.map(d=>{const common=words.filter(w=>d.words.includes(w));const coverage=common.reduce((v,w)=>v+idf(w),0)/words.reduce((v,w)=>v+idf(w),0);const phrase=d.texts.some(t=>t===query);return {item:d.q,confidence:phrase?1:coverage,common:common.length};}).sort((a,b)=>b.confidence-a.confidence||b.common-a.common);
 const top=ranked[0]; return top.confidence>=.68&&top.common>=2&&(!ranked[1]||top.confidence-ranked[1].confidence>.08)?top:null;
}
export function compareResume(input) {
 const match=input.match(/resume\s*:\s*([\s\S]*?)\bjob\s*description\s*:\s*([\s\S]*)/i);
 if(!match)return null;
 const resume=match[1].trim(),job=match[2].trim();
 if(resume.length<80||job.length<80)return {title:'Add both texts',paragraphs:['Please include at least 80 characters of redacted resume text and 80 characters of job-description text, with the labels “Resume:” and “Job description:”.'],sources:[],topicId:28};
 const skills=['python','javascript','typescript','react','sql','excel','power bi','tableau','java','c++','figma','autocad','solidworks','sap','salesforce','accounting','marketing','project management','data analysis','machine learning','customer service','supply chain','logistics','english','thai','mandarin','communication','leadership','research','sales','manufacturing','engineering','aws','docker','git','html','css','finance'];
 const contains=(text,skill)=>new RegExp('(^|[^a-z0-9])'+skill.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text);
 const required=skills.filter(s=>contains(job,s)),matched=required.filter(s=>contains(resume,s)),missing=required.filter(s=>!contains(resume,s));
 const paragraphs=['This is a local keyword and structure check, not a suitability score. A missing keyword does not prove you lack a skill, and a match does not prove proficiency.'];
 paragraphs.push(required.length?`Skills mentioned in both texts: ${matched.join(', ')||'none from the recognised skill list'}.`:'I did not recognise standard skill keywords in this job description. Compare its responsibilities and essential criteria manually.');
 if(missing.length)paragraphs.push(`Job-description keywords not found in your resume: ${missing.join(', ')}. Add evidence only for skills you genuinely have; use a project or experience example to show how you applied them.`);
 if(!/\b(education|degree|university|bachelor|master)\b/i.test(resume))paragraphs.push('Add a clear education section with degree, subject and expected or completed graduation date.');
 if(!/\d/.test(resume))paragraphs.push('Where accurate, add a measurable result, project scope or relevant date. Do not invent metrics.');
 paragraphs.push('Put your strongest matching evidence near the top. For each essential requirement, include one truthful example of a task, the tool or approach you used, and its result. Keep immigration eligibility separate from this text comparison.');
 return {title:'Resume and job-description comparison',paragraphs,sources:[],topicId:28,action:'resume'};
}
export function answerQuestion(input, previousId=null) {
 if(typeof input!=='string'||!input.trim())throw new Error('Type a question first.');
 if(input.length>16000)throw new Error('Please keep your question under 16,000 characters.');
 const comparison=compareResume(input);if(comparison)return comparison;
 const match=matchQuestion(input,previousId);
 if(!match) return {title:'Let’s find the right topic',paragraphs:[/^(hi|hello|hey)$/i.test(input.trim())?'Hi! I can help with the 30 visa, career, resume and privacy topics in this answer library.':'I could not confidently match that question to this answer library. I do not want to guess, especially about visa eligibility.','Try a specific question such as “Can I work part-time on ED Plus?” or browse all 30 questions below. For case-specific immigration decisions, contact the responsible office.'],sources:[],topicId:null,suggestions:[3,6,16,28]};
 const q=match.item;
 return {title:q.question,paragraphs:q.paragraphs,sources:q.sources,topicId:q.id,action:q.action};
}
