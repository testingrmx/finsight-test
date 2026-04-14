export const CATS = ['Groceries','Dining','Transport','Entertainment','Healthcare','Education','Shopping','Utilities','Savings','Personal Care','Gifts','Other'];
const R = [
  [/grocery|groceries|supermarket|kirana|bigbasket|blinkit|zepto|dmart|sabzi|vegetable|fruit|ration/,'Groceries'],
  [/restaurant|cafe|coffee|tea|swiggy|zomato|food|dining|dhaba|canteen|biryani|pizza|burger|kfc|mcdonalds|dominos|bakery|snack|meal/,'Dining'],
  [/uber|ola|rapido|metro|bus|petrol|fuel|diesel|cab|taxi|train|irctc|auto|rickshaw|toll|parking|fastag|flight|airline/,'Transport'],
  [/netflix|prime|hotstar|disney|spotify|movie|cinema|pvr|inox|concert|theatre|game|steam|club|party|bar/,'Entertainment'],
  [/doctor|hospital|clinic|medicine|pharmacy|medplus|apollo|1mg|netmeds|health|dental|lab|diagnostic|tablet|vitamin/,'Healthcare'],
  [/school|college|tuition|coaching|udemy|coursera|byju|book|course|fees|exam|library|stationery/,'Education'],
  [/amazon|flipkart|myntra|ajio|meesho|nykaa|mall|clothes|dress|shirt|jeans|shoes|fashion|bag|watch|laptop|mobile|electronics/,'Shopping'],
  [/electricity|water bill|gas bill|internet|wifi|jio|airtel|bsnl|vodafone|rent|maintenance/,'Utilities'],
  [/mutual fund|sip|fd|fixed deposit|ppf|nps|invest|saving|groww|zerodha|insurance|lic/,'Savings'],
  [/salon|spa|haircut|grooming|beauty|skincare|soap|shampoo|perfume|makeup/,'Personal Care'],
  [/gift|birthday|anniversary|wedding|flower|sweets|donation/,'Gifts'],
];
export const autoCat = (d='') => { const s=d.toLowerCase(); for(const [p,c] of R) if(p.test(s)) return c; return 'Other'; };
