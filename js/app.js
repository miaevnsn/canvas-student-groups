const state = Store.load();
const app = document.getElementById("app");

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function student(id) {
  return state.students.find((item) => item.id === id);
}

function course(id) {
  return state.courses.find((item) => item.id === id);
}

function group(id) {
  return state.groups.find((item) => item.id === id);
}

function currentUser() {
  return student(state.currentUserId);
}

function persist() {
  Store.save(state);
}

function formatTime(value) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  if (!parts.length) return { view: "dashboard" };
  if (parts[0] === "courses" && parts[1]) return { view: "course", id: parts[1] };
  if (parts[0] === "groups" && parts[1]) return { view: "chat", id: parts[1] };
  return { view: parts[0] };
}

function go(path) {
  location.hash = `#/${path}`;
}

function navButton(view, icon, label, extraClass = "") {
  const route = parseHash();
  const active =
    route.view === view ||
    (view === "courses" && route.view === "course") ||
    (view === "groups" && route.view === "chat");
  return `
    <button class="nav-btn ${extraClass} ${active ? "active" : ""}" data-go="${view}">
      <span class="icon">${icon}</span>
      <span class="label">${label}</span>
    </button>
  `;
}

function avatar(person) {
  return `<div class="avatar" style="background:${person.color}">${person.initials}</div>`;
}

function renderShell(title, body) {
  const user = currentUser();
  app.innerHTML = `
    <nav class="global-nav" aria-label="Main">
      <div class="brand">C</div>
      ${navButton("dashboard", "▦", "Dashboard")}
      ${navButton("courses", "▤", "Courses")}
      ${navButton("calendar", "▦", "Calendar")}
      ${navButton("inbox", "✉", "Inbox")}
      ${navButton("groups", "💬", "Groups", "new-feature")}
    </nav>
    <div class="main">
      <header class="topbar">
        <h1>${title}</h1>
        <div class="user-chip">
          ${avatar(user)}
          <div>
            <strong>${user.name}</strong><br />
            <span>Student · prototype</span>
          </div>
        </div>
      </header>
      <main class="content">${body}</main>
    </div>
  `;

  app.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => go(button.dataset.go));
  });
}

function groupsForCourse(courseId) {
  return state.groups.filter((item) => item.courseId === courseId);
}

function lastMessage(groupId) {
  return state.messages
    .filter((item) => item.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

function renderDashboard() {
  const cards = state.courses
    .map(
      (item) => `
      <button class="course-card" data-course="${item.id}">
        <div class="course-color" style="background:${item.color}"></div>
        <div class="course-body">
          <div class="course-code">${item.code} · ${item.term}</div>
          <div class="course-title">${item.title}</div>
          <div class="meta">${groupsForCourse(item.id).length} group chats</div>
        </div>
      </button>
    `
    )
    .join("");

  const recent = [...state.groups]
    .map((item) => ({ item, last: lastMessage(item.id) }))
    .sort((a, b) => new Date(b.last?.createdAt || 0) - new Date(a.last?.createdAt || 0))
    .slice(0, 3)
    .map(({ item, last }) => {
      const related = course(item.courseId);
      return `
        <button class="list-card" data-group="${item.id}">
          <div>
            <h3>${item.name}</h3>
            <div class="meta">${related.code} · ${last ? last.text : "No messages yet"}</div>
          </div>
          <span class="chip">${item.memberIds.length} members</span>
        </button>
      `;
    })
    .join("");

  renderShell(
    "Dashboard",
    `
      <div class="banner">
        This is a student prototype of Canvas Student with a new <strong>Groups</strong> chat feature.
        All names, courses, and messages are fictional and stored only in this browser.
      </div>
      <div class="section-head"><h2>My Courses</h2></div>
      <div class="grid">${cards}</div>
      <div class="section-head" style="margin-top:28px"><h2>Recent group chats</h2></div>
      <div class="list">${recent}</div>
    `
  );

  bindCourseAndGroupClicks();
}

function bindCourseAndGroupClicks() {
  app.querySelectorAll("[data-course]").forEach((el) => {
    el.addEventListener("click", () => go(`courses/${el.dataset.course}`));
  });
  app.querySelectorAll("[data-group]").forEach((el) => {
    el.addEventListener("click", () => go(`groups/${el.dataset.group}`));
  });
}

function renderCourses() {
  const cards = state.courses
    .map(
      (item) => `
      <button class="course-card" data-course="${item.id}">
        <div class="course-color" style="background:${item.color}"></div>
        <div class="course-body">
          <div class="course-code">${item.code}</div>
          <div class="course-title">${item.title}</div>
          <div class="meta">${item.teacher} · ${item.term}</div>
        </div>
      </button>
    `
    )
    .join("");

  renderShell("Courses", `<div class="grid">${cards}</div>`);
  bindCourseAndGroupClicks();
}

function renderCourse(id) {
  const item = course(id);
  if (!item) return renderCourses();
  const chats = groupsForCourse(id)
    .map((chat) => {
      const last = lastMessage(chat.id);
      return `
        <button class="list-card" data-group="${chat.id}">
          <div>
            <h3>${chat.name}</h3>
            <div class="meta">${last ? `${student(last.senderId).name}: ${last.text}` : "No messages yet"}</div>
          </div>
          <span class="chip">Due ${chat.deadline || "—"}</span>
        </button>
      `;
    })
    .join("");

  renderShell(
    item.title,
    `
      <div class="breadcrumb"><button data-go="courses">Courses</button> / ${item.code}</div>
      <p class="meta">${item.teacher} · ${item.term}</p>
      <div class="section-head">
        <h2>Group chats</h2>
        <button class="btn btn-primary" id="create-from-course">Create group chat</button>
      </div>
      <div class="list">${chats || '<div class="empty">No group chats yet for this course.</div>'}</div>
    `
  );
  bindCourseAndGroupClicks();
  document.getElementById("create-from-course").addEventListener("click", () => openCreateModal(id));
}

function groupListMarkup() {
  if (!state.groups.length) return '<div class="empty">No group chats yet. Create one to get started.</div>';
  return state.groups
    .map((item) => {
      const related = course(item.courseId);
      const last = lastMessage(item.id);
      return `
        <button class="list-card" data-group="${item.id}">
          <div>
            <h3>${item.name}</h3>
            <div class="meta">${related.code} · ${related.title}<br />${last ? last.text : "No messages yet"}</div>
          </div>
          <span class="chip">${item.memberIds.length} members</span>
        </button>
      `;
    })
    .join("");
}

function renderGroups() {
  renderShell(
    "Group Chats",
    `
      <div class="section-head">
        <h2>Course groups</h2>
        <button class="btn btn-primary" id="create-group">Create group chat</button>
      </div>
      <div class="list">${groupListMarkup()}</div>
    `
  );
  bindCourseAndGroupClicks();
  document.getElementById("create-group").addEventListener("click", () => openCreateModal());
}

function openCreateModal(courseId = state.courses[0].id) {
  const checks = state.students
    .filter((item) => item.id !== state.currentUserId)
    .map(
      (item) => `
        <label><input type="checkbox" value="${item.id}" /> ${item.name}</label>
      `
    )
    .join("");

  const options = state.courses
    .map((item) => `<option value="${item.id}" ${item.id === courseId ? "selected" : ""}>${item.code} · ${item.title}</option>`)
    .join("");

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal">
      <h2>Create group chat</h2>
      <div class="form-grid">
        <label>Group name</label>
        <input class="field" id="new-name" placeholder="e.g. Lab report team" />
        <label>Course</label>
        <select class="field" id="new-course">${options}</select>
        <label>Project deadline</label>
        <input class="field" id="new-deadline" type="date" />
        <label>Members</label>
        <div class="checks">${checks}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost" id="cancel-create">Cancel</button>
          <button class="btn btn-primary" id="save-create">Create</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector("#cancel-create").addEventListener("click", () => backdrop.remove());
  backdrop.querySelector("#save-create").addEventListener("click", () => {
    const name = backdrop.querySelector("#new-name").value.trim();
    if (!name) {
      backdrop.querySelector("#new-name").focus();
      return;
    }
    const memberIds = [state.currentUserId, ...[...backdrop.querySelectorAll(".checks input:checked")].map((el) => el.value)];
    const created = {
      id: uid("g"),
      courseId: backdrop.querySelector("#new-course").value,
      name,
      memberIds,
      deadline: backdrop.querySelector("#new-deadline").value,
      links: [],
      pinnedIds: [],
    };
    state.groups.unshift(created);
    persist();
    backdrop.remove();
    go(`groups/${created.id}`);
  });
}

function renderChat(id) {
  const chat = group(id);
  if (!chat) return renderGroups();
  const related = course(chat.courseId);
  const messages = state.messages
    .filter((item) => item.groupId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const bubbles = messages
    .map((item) => {
      const sender = student(item.senderId);
      const mine = item.senderId === state.currentUserId;
      return `
        <div class="bubble-row ${mine ? "mine" : ""}">
          ${avatar(sender)}
          <div class="bubble">
            <div class="sender">${sender.name}${chat.pinnedIds.includes(item.id) ? " · pinned" : ""}</div>
            <div>${item.text}</div>
            <div class="stamp">${formatTime(item.createdAt)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const members = chat.memberIds
    .map((memberId) => {
      const person = student(memberId);
      const canRemove = memberId !== state.currentUserId;
      return `
        <div class="member-row">
          <span>${person.name}${memberId === state.currentUserId ? " (you)" : ""}</span>
          ${canRemove ? `<button class="btn btn-danger" data-remove="${memberId}">Remove</button>` : ""}
        </div>
      `;
    })
    .join("");

  const addOptions = state.students
    .filter((item) => !chat.memberIds.includes(item.id))
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");

  const links = chat.links
    .map(
      (item) => `
      <div class="link-row">
        <a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>
        <button class="btn btn-ghost" data-unlink="${item.id}">Remove</button>
      </div>
    `
    )
    .join("");

  const pinned = chat.pinnedIds
    .map((messageId) => state.messages.find((item) => item.id === messageId))
    .filter(Boolean)
    .map((item) => `<li>${student(item.senderId).name}: ${item.text}</li>`)
    .join("");

  renderShell(
    chat.name,
    `
      <div class="breadcrumb">
        <button data-go="groups">Group Chats</button> /
        <button data-course="${related.id}">${related.code}</button>
      </div>
      <div class="layout-2">
        <section class="chat-shell">
          <div class="chat-head">
            <div>
              <strong>${chat.name}</strong>
              <div class="meta">${related.code} · ${related.title}</div>
            </div>
            <span class="chip">${chat.memberIds.length} members</span>
          </div>
          <div class="messages" id="message-list">${bubbles || '<div class="empty">Start the conversation.</div>'}</div>
          <form class="composer" id="send-form">
            <input id="message-input" placeholder="Message ${chat.name}" autocomplete="off" />
            <button class="btn btn-primary" type="submit">Send</button>
          </form>
        </section>
        <aside>
          <div class="info-card">
            <h3>Project information</h3>
            <label>Deadline</label>
            <input class="field" id="deadline" type="date" value="${chat.deadline || ""}" />
            <div style="height:10px"></div>
            <h3>Pinned messages</h3>
            <ul>${pinned || "<li>No pinned messages yet.</li>"}</ul>
            <label>Pin latest message</label>
            <button class="btn btn-ghost" id="pin-latest" ${messages.length ? "" : "disabled"}>Pin latest</button>
          </div>
          <div class="info-card" style="margin-top:12px">
            <h3>Important links</h3>
            ${links || '<p class="meta">No links yet.</p>'}
            <label>Add link</label>
            <input class="field" id="link-title" placeholder="Title" />
            <div style="height:8px"></div>
            <input class="field" id="link-url" placeholder="https://" />
            <div style="height:8px"></div>
            <button class="btn btn-primary" id="add-link">Add link</button>
          </div>
          <div class="info-card" style="margin-top:12px">
            <h3>Members</h3>
            ${members}
            <div style="height:10px"></div>
            <label>Add member</label>
            <select class="field" id="add-member" ${addOptions ? "" : "disabled"}>
              <option value="">Select a classmate</option>
              ${addOptions}
            </select>
            <div style="height:8px"></div>
            <button class="btn btn-ghost" id="add-member-btn">Add</button>
          </div>
        </aside>
      </div>
    `
  );

  bindCourseAndGroupClicks();
  const list = document.getElementById("message-list");
  list.scrollTop = list.scrollHeight;

  document.getElementById("send-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;
    state.messages.push({
      id: uid("m"),
      groupId: chat.id,
      senderId: state.currentUserId,
      text,
      createdAt: new Date().toISOString(),
    });
    persist();
    renderChat(chat.id);
  });

  document.getElementById("deadline").addEventListener("change", (event) => {
    chat.deadline = event.target.value;
    persist();
  });

  document.getElementById("pin-latest").addEventListener("click", () => {
    const latest = messages[messages.length - 1];
    if (!latest) return;
    if (!chat.pinnedIds.includes(latest.id)) chat.pinnedIds.push(latest.id);
    persist();
    renderChat(chat.id);
  });

  document.getElementById("add-link").addEventListener("click", () => {
    const title = document.getElementById("link-title").value.trim();
    const url = document.getElementById("link-url").value.trim();
    if (!title || !url) return;
    chat.links.push({ id: uid("l"), title, url });
    persist();
    renderChat(chat.id);
  });

  document.getElementById("add-member-btn").addEventListener("click", () => {
    const select = document.getElementById("add-member");
    if (!select.value) return;
    chat.memberIds.push(select.value);
    persist();
    renderChat(chat.id);
  });

  app.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      chat.memberIds = chat.memberIds.filter((memberId) => memberId !== button.dataset.remove);
      persist();
      renderChat(chat.id);
    });
  });

  app.querySelectorAll("[data-unlink]").forEach((button) => {
    button.addEventListener("click", () => {
      chat.links = chat.links.filter((item) => item.id !== button.dataset.unlink);
      persist();
      renderChat(chat.id);
    });
  });
}

function renderCalendar() {
  const items = state.groups
    .filter((item) => item.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .map((item) => {
      const related = course(item.courseId);
      return `
        <button class="list-card" data-group="${item.id}">
          <div>
            <h3>${item.deadline}</h3>
            <div class="meta">${related.code} · ${item.name}</div>
          </div>
          <span class="chip">Group project</span>
        </button>
      `;
    })
    .join("");

  renderShell(
    "Calendar",
    `
      <p class="meta">Deadlines from group projects appear here alongside a simple Canvas-style calendar list.</p>
      <div class="list">${items || '<div class="empty">No group deadlines yet.</div>'}</div>
    `
  );
  bindCourseAndGroupClicks();
}

function renderInbox() {
  renderShell(
    "Inbox",
    `
      <div class="info-card">
        <h3>Course announcements</h3>
        <p>INF100: Lab 4 opens on Monday.</p>
        <p>DAT250: Remember the Thursday demo.</p>
        <p class="meta">The existing Canvas Inbox stays for course mail. Use <strong>Groups</strong> in the sidebar for classmate project chats.</p>
      </div>
    `
  );
}

function render() {
  const route = parseHash();
  if (route.view === "courses") return renderCourses();
  if (route.view === "course") return renderCourse(route.id);
  if (route.view === "groups") return renderGroups();
  if (route.view === "chat") return renderChat(route.id);
  if (route.view === "calendar") return renderCalendar();
  if (route.view === "inbox") return renderInbox();
  return renderDashboard();
}

window.addEventListener("hashchange", render);
render();
