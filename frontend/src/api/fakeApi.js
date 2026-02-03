// Very small fake API backed by localStorage. Uses timeouts to simulate latency.

function wait(ms = 300){
  return new Promise(res=>setTimeout(res, ms));
}

function getData(){
  const raw = localStorage.getItem('bw_data');
  if(raw) return JSON.parse(raw);
  const base = { users: [], transactions: [], budgets: [] };
  localStorage.setItem('bw_data', JSON.stringify(base));
  return base;
}

function saveData(data){
  localStorage.setItem('bw_data', JSON.stringify(data));
}

function generateToken(){
  return Math.random().toString(36).slice(2);
}

export const fakeApi = {
  register: async ({ username, email, password }) => {
    await wait(400);
    const db = getData();
    if(db.users.find(u=>u.email===email)){
      return { error: 'Email already in use' };
    }
    const newUser = { id: Date.now(), username, email, password };
    db.users.push(newUser);
    saveData(db);
    return { success: true };
  },
  login: async ({ identifier, password }) => {
    await wait(400);
    const db = getData();
    const user = db.users.find(u => (u.email === identifier || u.username === identifier) && u.password === password);
    if(!user) return { error: 'Invalid credentials' };
    const token = generateToken();
    return { token, user: { id:user.id, username:user.username, email:user.email } };
  },
  getSummary: async () => {
    await wait(200);
    const db = getData();
    const income = db.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expenses = db.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const recent = db.transactions.slice(-5).reverse();
    return { income, expenses, recent };
  },
  listTransactions: async ()=>{
    await wait(200);
    const db = getData();
    return db.transactions;
  },
  addTransaction: async (t)=>{
    await wait(200);
    const db = getData();
    const txn = { id: Date.now(), ...t };
    db.transactions.push(txn);
    saveData(db);
    return txn;
  },
  updateTransaction: async (id, patch)=>{
    await wait(200);
    const db = getData();
    const idx = db.transactions.findIndex(x=>x.id===id);
    if(idx===-1) return { error:'Not found' };
    db.transactions[idx] = { ...db.transactions[idx], ...patch };
    saveData(db);
    return db.transactions[idx];
  },
  deleteTransaction: async (id)=>{
    await wait(200);
    const db = getData();
    db.transactions = db.transactions.filter(x=>x.id!==id);
    saveData(db);
    return { success:true };
  },
  // budgets
  listBudgets: async ()=>{
    await wait(200);
    const db = getData();
    return db.budgets;
  },
  addBudget: async (b)=>{
    await wait(200);
    const db = getData();
    const bud = { id: Date.now(), ...b, spent:0 };
    db.budgets.push(bud);
    saveData(db);
    return bud;
  },
  updateBudget: async (id, patch)=>{
    await wait(200);
    const db = getData();
    const idx = db.budgets.findIndex(x=>x.id===id);
    if(idx===-1) return { error:'Not found' };
    db.budgets[idx] = { ...db.budgets[idx], ...patch };
    saveData(db);
    return db.budgets[idx];
  },
  deleteBudget: async (id)=>{
    await wait(200);
    const db = getData();
    db.budgets = db.budgets.filter(x=>x.id!==id);
    saveData(db);
    return { success:true };
  },
  // profile
  getProfile: async (email)=>{
    await wait(200);
    const db = getData();
    const user = db.users.find(u=>u.email===email);
    if(!user) return { error:'Not found' };
    return { id:user.id, username:user.username, email:user.email };
  },
  updateProfile: async (email, patch)=>{
    await wait(200);
    const db = getData();
    const idx = db.users.findIndex(u=>u.email===email);
    if(idx===-1) return { error:'Not found' };
    db.users[idx] = { ...db.users[idx], ...patch };
    saveData(db);
    return { id: db.users[idx].id, username:db.users[idx].username, email:db.users[idx].email };
  }
};
