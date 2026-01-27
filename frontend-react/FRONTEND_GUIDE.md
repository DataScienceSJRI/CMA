# Consultation Management System - React Frontend

A beginner-friendly React application for managing consultations in the Biostatistics & Data Science department.

## 🎓 **For Beginners: What You Need to Know**

### What is React?
- **React** is a library for building user interfaces
- It breaks your UI into **components** (reusable pieces like LEGO blocks)
- Components use **JSX** (looks like HTML but it's JavaScript)
- React uses **hooks** (like `useState`) to manage data

### What is Vite?
- **Vite** is a tool that runs your React app during development
- It's faster and simpler than older tools
- Automatically refreshes the page when you save changes

---

## 📁 **Project Structure**

```
frontend-react/
├── src/
│   ├── pages/              # Full page components
│   │   ├── Login.jsx       # Login page (authentication)
│   │   ├── PersonalDashboard.jsx  # Main dashboard with consultation list
│   │   └── NewConsultation.jsx    # Form to create new consultations
│   │
│   ├── services/           # Backend API communication
│   │   └── api.js          # All API calls (GET, POST, PUT, DELETE)
│   │
│   ├── utils/              # Helper functions
│   │   └── auth.js         # Authentication utilities
│   │
│   ├── App.jsx             # Main component with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles (Tailwind)
│
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.js          # Vite configuration
```

---

## 🚀 **Getting Started**

### Prerequisites
- Node.js v18+ (you have v24 ✓)
- Backend running at `http://localhost:8000`

### Installation

Already done! But if starting fresh:

```bash
# Navigate to project
cd frontend-react

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Server

The app runs at: **http://localhost:5173/**

- Open your browser and visit this URL
- Changes auto-refresh when you save files
- Press `Ctrl+C` to stop the server

---

## 🔑 **How Authentication Works**

### Mock Authentication (Development)
Your backend uses mock tokens for testing:

```javascript
// To test different roles, use these tokens in Login:
Username: any
Password: any

// The backend will respond based on the token you send
```

### Login Flow
1. User enters credentials on `/login`
2. Backend returns a token and user data
3. Token is saved in `localStorage` (browser storage)
4. Token is sent with every API request automatically
5. Protected routes check if token exists

### Files Involved
- `src/pages/Login.jsx` - Login UI and form handling
- `src/utils/auth.js` - Functions to save/get/clear login data
- `src/services/api.js` - Adds token to all requests

---

## 📖 **Understanding Key Concepts**

### 1. **State Management with `useState`**

```javascript
const [consultations, setConsultations] = useState([]);
//     ↑ current value      ↑ function to update it   ↑ initial value
```

- State is data that can change
- When state changes, React re-renders the component
- Never modify state directly, always use the setter function

Example:
```javascript
// ❌ Wrong
consultations.push(newItem);

// ✅ Correct
setConsultations([...consultations, newItem]);
```

### 2. **Side Effects with `useEffect`**

```javascript
useEffect(() => {
  // This code runs when component loads
  loadConsultations();
}, []); // Empty array = run only once
```

- Used for fetching data, subscriptions, etc.
- Runs after component renders
- Dependency array controls when it re-runs

### 3. **Navigation with React Router**

```javascript
// In App.jsx - define routes
<Route path="/dashboard" element={<PersonalDashboard />} />

// In any component - navigate programmatically
const navigate = useNavigate();
navigate('/dashboard');
```

### 4. **API Calls with Async/Await**

```javascript
const loadData = async () => {
  try {
    const data = await consultationAPI.getPersonalConsultations();
    setConsultations(data);
  } catch (error) {
    console.error(error);
  }
};
```

- `async/await` makes asynchronous code look synchronous
- Always wrap in `try/catch` for error handling

---

## 🔄 **CRUD Operations**

### CREATE - Add New Consultation

**File:** `src/pages/NewConsultation.jsx`

```javascript
// Form submission
const handleSubmit = async (e) => {
  e.preventDefault(); // Prevent page reload
  await consultationAPI.createConsultation(formData);
  navigate('/dashboard'); // Go back to list
};
```

### READ - Display Consultations

**File:** `src/pages/PersonalDashboard.jsx`

```javascript
// Load data on component mount
useEffect(() => {
  loadConsultations();
}, []);

const loadConsultations = async () => {
  const data = await consultationAPI.getPersonalConsultations();
  setConsultations(data);
};
```

### UPDATE - Edit Consultation

**To be implemented:** Create `EditConsultation.jsx` similar to `NewConsultation.jsx`

```javascript
// Fetch existing data
const consultation = await consultationAPI.getConsultationById(id);
setFormData(consultation);

// Update
await consultationAPI.updateConsultation(id, formData);
```

### DELETE - Remove Consultation

**Already in:** `PersonalDashboard.jsx`

```javascript
const handleDelete = async (id) => {
  await consultationAPI.deleteConsultation(id);
  // Update UI immediately
  setConsultations(consultations.filter(c => c.id !== id));
};
```

---

## 🎨 **Styling with Tailwind CSS**

Tailwind uses utility classes instead of writing CSS:

```jsx
// Instead of this CSS:
// .button { background-color: blue; padding: 8px; border-radius: 4px; }

// Use this:
<button className="bg-blue-500 p-2 rounded">Click me</button>
```

### Common Patterns

```jsx
// Flexbox layout
<div className="flex items-center justify-between">

// Spacing
<div className="p-4 m-2 space-y-4">
//        ↑    ↑      ↑
//     padding margin  vertical spacing

// Colors
<div className="bg-primary text-white">

// Responsive design
<div className="text-sm md:text-lg lg:text-xl">
//                   ↑ medium   ↑ large screens
```

### Dark Mode

Toggle with class on root element:

```javascript
const [darkMode, setDarkMode] = useState(false);

<div className={darkMode ? 'dark' : ''}>
  {/* Dark mode styles automatically apply */}
  <div className="bg-white dark:bg-gray-800">
</div>
```

---

## 🧪 **Testing Your Work**

### 1. Start Backend

```bash
cd backend
python main.py
# Should run on http://localhost:8000
```

### 2. Start Frontend

```bash
cd frontend-react
npm run dev
# Should run on http://localhost:5173
```

### 3. Test Flow

1. Visit http://localhost:5173
2. You should see the login page
3. Enter any username/password (mock auth)
4. Click "Sign In" - should redirect to dashboard
5. Click "+ New" to create a consultation
6. Fill form and submit
7. Should see new consultation in the list

### 4. Check Browser Console

Press `F12` or `Cmd+Option+I`:
- **Console tab**: See errors and logs
- **Network tab**: See API calls
- **React DevTools**: Inspect components (install extension)

---

## 🐛 **Common Issues & Solutions**

### Issue: "Cannot read property of undefined"

**Cause:** Trying to access data that hasn't loaded yet

**Solution:** Use optional chaining or conditional rendering

```javascript
// ❌ Bad
<p>{user.name}</p>

// ✅ Good
<p>{user?.name || 'Loading...'}</p>

// or
{user && <p>{user.name}</p>}
```

### Issue: "Too many re-renders"

**Cause:** Calling state setter in component body

```javascript
// ❌ Wrong
function Component() {
  const [count, setCount] = useState(0);
  setCount(1); // Infinite loop!
}

// ✅ Correct
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(1); // Safe inside useEffect
  }, []);
}
```

### Issue: CORS Error

**Cause:** Backend not allowing frontend origin

**Solution:** Check backend CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add this
)
```

### Issue: 404 Not Found on API Calls

**Check:**
1. Backend is running
2. API URL in `src/services/api.js` is correct
3. Endpoint paths match backend routes

---

## 📚 **Next Steps**

### Phase 1: Complete Basic Features ✓
- [x] Login page
- [x] Dashboard with consultation list
- [x] Create new consultation
- [x] Delete consultation
- [x] API service layer
- [x] Authentication utilities

### Phase 2: Add More Features
- [ ] Edit consultation (UPDATE operation)
- [ ] Department Overview page (for HOD/Faculty)
- [ ] Reports page
- [ ] Member management
- [ ] Search and filters
- [ ] Pagination

### Phase 3: Enhancements
- [ ] Form validation
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Error boundaries
- [ ] Responsive mobile design

---

## 📖 **Learning Resources**

### Beginner-Friendly
- **React Docs**: https://react.dev/learn
- **Tailwind Docs**: https://tailwindcss.com/docs
- **JavaScript.info**: https://javascript.info/

### Videos
- React in 100 seconds: https://www.youtube.com/watch?v=Tn6-PIqc4UM
- Tailwind CSS Tutorial: Search "Traversy Media Tailwind"

### Interactive Practice
- React Tutorial: https://react.dev/learn/tutorial-tic-tac-toe
- FreeCodeCamp React Course

---

## 🤝 **How to Extend**

### Adding a New Page

1. **Create component** in `src/pages/`:

```javascript
// src/pages/Reports.jsx
function Reports() {
  return <div>Reports Page</div>;
}
export default Reports;
```

2. **Add route** in `src/App.jsx`:

```javascript
import Reports from './pages/Reports';

<Route path="/reports" element={
  <ProtectedRoute>
    <Reports />
  </ProtectedRoute>
} />
```

3. **Add navigation link**:

```javascript
<button onClick={() => navigate('/reports')}>
  Reports
</button>
```

### Adding a New API Endpoint

1. **Add to `src/services/api.js`**:

```javascript
export const consultationAPI = {
  // ... existing methods
  
  searchConsultations: async (query) => {
    const response = await api.get('/consultations/search', {
      params: { q: query }
    });
    return response.data;
  },
};
```

2. **Use in component**:

```javascript
const handleSearch = async (query) => {
  const results = await consultationAPI.searchConsultations(query);
  setConsultations(results);
};
```

---

## 💡 **Tips for Success**

1. **Start Small**: Don't try to build everything at once
2. **Console.log Everything**: Debug by logging state and data
3. **Read Error Messages**: They usually tell you what's wrong
4. **Use React DevTools**: Install the browser extension
5. **Break Down Components**: If it's too big, split it
6. **Ask Questions**: Comment your code when you're confused
7. **Test Often**: Run the app after small changes

---

## 🎯 **Summary**

You now have a working React frontend with:

✅ Modern tooling (Vite, React, Tailwind)
✅ Authentication flow
✅ CRUD operations (Create, Read, Delete)
✅ API integration with backend
✅ Clean, organized code structure
✅ Beginner-friendly patterns

**Next:** Test the app, experiment with the code, and add the Update functionality!

---

## 📞 **Getting Help**

- **React Docs**: https://react.dev
- **Stack Overflow**: Tag questions with `reactjs`
- **Browser Console**: Your first debugging tool
- **Comments in Code**: Read the comments in each file!

Happy coding! 🚀
