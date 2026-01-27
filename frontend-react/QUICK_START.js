// Quick Start Guide - Your First Steps with React

/*
===========================================
STEP 1: UNDERSTAND THE FILE STRUCTURE
===========================================

frontend-react/
│
├── src/
│   ├── main.jsx              ← Entry point (starts everything)
│   ├── App.jsx               ← Routes (which page to show)
│   ├── index.css             ← Global styles
│   │
│   ├── pages/                ← Full pages users see
│   │   ├── Login.jsx         
│   │   ├── PersonalDashboard.jsx
│   │   └── NewConsultation.jsx
│   │
│   ├── services/             ← Talks to backend
│   │   └── api.js            
│   │
│   └── utils/                ← Helper functions
│       └── auth.js           
│
└── package.json              ← Lists all libraries used


===========================================
STEP 2: HOW DATA FLOWS IN REACT
===========================================

User Action → State Update → React Re-renders → UI Updates

Example:
1. User clicks "Delete" button
2. handleDelete() runs
3. Calls backend API to delete
4. Updates state: setConsultations(newList)
5. React sees state changed
6. React re-renders component with new list
7. User sees consultation removed


===========================================
STEP 3: KEY REACT CONCEPTS YOU'LL USE
===========================================

1. COMPONENTS (Reusable UI blocks)
   
   function MyComponent() {
     return <div>Hello!</div>;
   }

2. STATE (Data that changes)
   
   const [name, setName] = useState('');
   //     ↑ current    ↑ updater    ↑ initial
   
   setName('John'); // Updates name to 'John'

3. PROPS (Data passed to components)
   
   <UserCard name="John" age={25} />
   
   function UserCard({ name, age }) {
     return <p>{name} is {age}</p>;
   }

4. EVENTS (User interactions)
   
   <button onClick={handleClick}>Click me</button>
   
   function handleClick() {
     alert('Clicked!');
   }

5. CONDITIONAL RENDERING (Show/hide elements)
   
   {isLoggedIn ? <Dashboard /> : <Login />}
   {error && <p className="error">{error}</p>}


===========================================
STEP 4: YOUR FIRST MODIFICATION
===========================================

Let's add a simple feature: Show total consultation count

📁 File: src/pages/PersonalDashboard.jsx

Find this line:
  <h2>Recent Consultations</h2>

Change to:
  <h2>Recent Consultations ({consultations.length})</h2>

That's it! The number updates automatically because:
- consultations is state
- When it changes, React re-renders
- length is recalculated


===========================================
STEP 5: DEBUGGING TIPS
===========================================

1. Add console.log() everywhere!
   
   console.log('consultations:', consultations);
   console.log('user:', user);

2. Check browser console (F12)
   - Red errors = something broke
   - Yellow warnings = not critical but should fix
   - Blue logs = your console.log() output

3. React DevTools (install browser extension)
   - See component tree
   - Inspect props and state
   - Track re-renders

4. Network tab
   - See all API calls
   - Check request/response data
   - Verify backend is responding


===========================================
STEP 6: COMMON TASKS
===========================================

✅ ADD A NEW FIELD TO THE FORM

In NewConsultation.jsx:

1. Add to state:
   const [formData, setFormData] = useState({
     ...existing fields...,
     email: '',  // ← NEW
   });

2. Add input field:
   <input
     name="email"
     value={formData.email}
     onChange={handleChange}
   />

3. Done! handleChange and handleSubmit already handle it


✅ CHANGE A COLOR

In tailwind.config.js:

colors: {
  primary: "#0d9488",  // ← Change this hex code
}

All primary colors update automatically!


✅ ADD A SEARCH FEATURE

1. Add state:
   const [searchTerm, setSearchTerm] = useState('');

2. Add input:
   <input
     value={searchTerm}
     onChange={(e) => setSearchTerm(e.target.value)}
     placeholder="Search..."
   />

3. Filter results:
   const filtered = consultations.filter(c =>
     c.guest_name.toLowerCase().includes(searchTerm.toLowerCase())
   );

4. Display filtered:
   {filtered.map(consultation => ...)}


===========================================
STEP 7: TESTING CHECKLIST
===========================================

Before saying "it works":

☐ Backend running (http://localhost:8000)
☐ Frontend running (http://localhost:5173)
☐ No errors in browser console
☐ Can login
☐ Can view consultations
☐ Can create new consultation
☐ Can delete consultation
☐ Navigation works
☐ Logout works


===========================================
STEP 8: NEXT FEATURES TO ADD
===========================================

Easy:
- Add loading spinner
- Add success/error messages
- Add confirmation dialogs
- Style improvements

Medium:
- Edit consultation (UPDATE)
- Search and filter
- Sort by date/name
- Pagination

Advanced:
- Department overview page
- Reports page
- Member management
- Real-time updates


===========================================
USEFUL COMMANDS
===========================================

# Start development server
npm run dev

# Stop server
Ctrl + C

# Install new package
npm install package-name

# Build for production
npm run build

# Preview production build
npm run preview


===========================================
KEYBOARD SHORTCUTS
===========================================

Cmd/Ctrl + S        Save file
Cmd/Ctrl + /        Comment/uncomment
Cmd/Ctrl + D        Select next occurrence
Cmd/Ctrl + F        Find in file
F12 or Cmd+Opt+I    Open developer tools
Cmd/Ctrl + Shift+F  Search in all files


===========================================
REMEMBER
===========================================

1. Save often - Vite auto-refreshes
2. Read error messages carefully
3. Check console first when debugging
4. Test after every small change
5. Comment your code for future you
6. Google error messages if stuck
7. It's OK to not understand everything at once

Happy coding! You've got this! 🚀

*/
