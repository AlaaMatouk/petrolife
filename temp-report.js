const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const routesPath = path.join(projectRoot, "src", "routes", "index.tsx");
const routesContent = fs.readFileSync(routesPath, "utf8");

const dashboards = {
  Admin: [],
  Company: [],
  Distributor: [],
};
const seenNames = {
  Admin: new Set(),
  Company: new Set(),
  Distributor: new Set(),
};

function resolveWithExtensions(basePath) {
  if (!basePath) return null;
  const candidates = ["", ".tsx", ".ts", ".jsx", ".js"].map((ext) => basePath + ext);
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch (err) {
      // ignore
    }
  }
  try {
    if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
      const indexCandidates = [
        "index.tsx",
        "index.ts",
        "index.jsx",
        "index.js",
      ].map((name) => path.join(basePath, name));
      for (const candidate of indexCandidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

const importInfo = new Map();
const importRegex = /import\s+([^;]+?)\s+from\s+["']([^"']+)["'];/g;
let importMatch;
while ((importMatch = importRegex.exec(routesContent)) !== null) {
  const spec = importMatch[1].trim();
  const source = importMatch[2];
  const absBase = path.resolve(path.dirname(routesPath), source);
  const resolved = resolveWithExtensions(absBase);
  const register = (name) => {
    if (!name) return;
    if (!importInfo.has(name)) {
      importInfo.set(name, { source, absBase, resolved });
    }
  };
  if (spec.startsWith("{")) {
    const inner = spec.slice(1, -1);
    inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const parts = entry.split(/\s+as\s+/).map((s) => s.trim());
        const alias = parts[1] || parts[0];
        register(alias);
      });
  } else if (spec.includes("{")) {
    const [defaultPart, restPart] = spec.split("{");
    const defaultName = defaultPart.replace(/,/g, "").trim();
    if (defaultName) register(defaultName);
    const inner = restPart.replace("}", "");
    inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const parts = entry.split(/\s+as\s+/).map((s) => s.trim());
        const alias = parts[1] || parts[0];
        register(alias);
      });
  } else {
    register(spec);
  }
}

const componentPathCache = new Map();

function resolveComponentFile(name, startPath, depth = 0, visited = new Set()) {
  if (!startPath || depth > 10) return startPath;
  let candidate = startPath;
  try {
    if (!fs.existsSync(candidate)) return null;
    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      const next = resolveWithExtensions(candidate);
      if (!next) return null;
      return resolveComponentFile(name, next, depth + 1, visited);
    }
  } catch (err) {
    return null;
  }
  if (visited.has(candidate)) {
    return candidate;
  }
  visited.add(candidate);
  const ext = path.extname(candidate);
  if (ext === ".tsx" || ext === ".jsx") {
    return candidate;
  }
  const dir = path.dirname(candidate);
  const directCandidate = [
    path.join(dir, `${name}.tsx`),
    path.join(dir, `${name}.ts`),
    path.join(dir, `${name}.jsx`),
    path.join(dir, `${name}.js`),
  ].find((p) => fs.existsSync(p));
  if (directCandidate) {
    return resolveComponentFile(name, directCandidate, depth + 1, visited);
  }
  if (ext === ".ts" || ext === ".js") {
    const content = fs.readFileSync(candidate, "utf8");
    const reExportRegex = /export\s+\{([^}]+)\}\s+from\s+["'](.+?)["']/g;
    let match;
    while ((match = reExportRegex.exec(content)) !== null) {
      const specifiers = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const spec of specifiers) {
        const parts = spec.split(/\s+as\s+/).map((s) => s.trim());
        const original = parts[0];
        const alias = parts[1] || original;
        if (alias === name || original === name) {
          const nextBase = path.resolve(path.dirname(candidate), match[2]);
          const nextPath = resolveWithExtensions(nextBase);
          if (!nextPath) continue;
          const nextName = original === "default" ? alias : original;
          const result = resolveComponentFile(nextName, nextPath, depth + 1, visited);
          if (result) return result;
        }
      }
    }
    const starRegex = /export\s+\*\s+from\s+["'](.+?)["']/g;
    let starMatch;
    while ((starMatch = starRegex.exec(content)) !== null) {
      const nextBase = path.resolve(path.dirname(candidate), starMatch[1]);
      const nextPath = resolveWithExtensions(nextBase);
      if (!nextPath) continue;
      const result = resolveComponentFile(name, nextPath, depth + 1, visited);
      if (result) return result;
    }
  }
  return candidate;
}

function getComponentFilePath(name) {
  if (componentPathCache.has(name)) {
    return componentPathCache.get(name);
  }
  let filePath = null;
  if (importInfo.has(name)) {
    const info = importInfo.get(name);
    const start = info.resolved || resolveWithExtensions(info.absBase);
    filePath = resolveComponentFile(name, start);
  } else if (name === "NotFound") {
    filePath = routesPath;
  }
  componentPathCache.set(name, filePath);
  return filePath;
}

const uiCache = new Map();

function evaluateUI(name, content) {
  if (name === "NotFound") return "Pending";
  if (!content || !content.trim()) return "Not started";
  const hasJSX = /return\s*[({]|=>\s*</.test(content) && /</.test(content);
  if (!hasJSX) return "Not started";
  const pendingRegex = /(TODO|Coming\s+Soon|Placeholder|Under\s+Construction|Mock\s+Data|Work\s+in\s+Progress)/i;
  if (pendingRegex.test(content)) return "Pending";
  return "Done";
}

function evaluateFirestore(content) {
  if (!content || !content.trim()) return "Not started";
  const firestoreImportRegex = /from\s+["'][^"']*firebase\/firestore["']/i;
  const servicesFirestoreRegex = /from\s+["'][^"']*services\/firestore["']/i;
  const keywordRegex = /(getDocs|getDoc|collection|addDoc|setDoc|updateDoc|deleteDoc|onSnapshot|query|where|orderBy|limit|startAfter|startAt|endBefore|endAt)/;
  if (
    firestoreImportRegex.test(content) ||
    servicesFirestoreRegex.test(content) ||
    keywordRegex.test(content)
  ) {
    return "Done";
  }
  if (/firestore/i.test(content)) {
    return "Pending";
  }
  return "Not started";
}

function formatRouteKey(key) {
  if (!key) return null;
  const parts = key.split("_").filter(Boolean);
  return parts
    .map((part) => {
      if (part.length <= 3) return part.toUpperCase();
      return part.charAt(0) + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function capitalize(word) {
  if (!word) return "";
  if (word.length <= 3 && word === word.toUpperCase()) {
    return word.toUpperCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatPathLiteral(literal) {
  if (!literal) return null;
  const segments = literal.split("/").filter(Boolean);
  const parts = [];
  let hasDetails = false;
  for (const seg of segments) {
    if (seg.startsWith(":")) {
      if (!hasDetails) {
        parts.push("Details");
        hasDetails = true;
      }
      continue;
    }
    const words = seg
      .split("-")
      .filter(Boolean)
      .map((w) => capitalize(w))
      .join(" ");
    parts.push(words);
  }
  return parts.join(" ") || literal;
}

function formatComponentName(name) {
  if (!name) return "";
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .trim();
}

const componentAnalysisCache = new Map();

function getComponentAnalysis(name) {
  if (componentAnalysisCache.has(name)) {
    return componentAnalysisCache.get(name);
  }
  const filePath = getComponentFilePath(name);
  let uiStatus = "Not started";
  let fetchStatus = "Not started";
  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    uiStatus = evaluateUI(name, content);
    fetchStatus = evaluateFirestore(content);
  }
  const result = { filePath, uiStatus, fetchStatus };
  componentAnalysisCache.set(name, result);
  return result;
}

const lines = routesContent.split(/\r?\n/);
const stack = [];
let routeBuffer = null;

function currentSection() {
  if (!stack.length) return null;
  return stack[stack.length - 1];
}

function shouldSkipRoute({ routeKey, pathLiteral, componentName }) {
  if (pathLiteral === "*" || routeKey === "LOGIN") return true;
  const skipKeys = ["TEST", "TEST_CHART", "ICON"]; // partial matches
  if (routeKey && skipKeys.some((key) => routeKey.includes(key))) return true;
  if (pathLiteral && /test|icons/i.test(pathLiteral)) return true;
  if (componentName === "LayoutWrapper" || componentName === "AdminLayoutWrapper") return true;
  return false;
}

function categorizeDashboard(routeKey, pathLiteral, componentPath) {
  const section = currentSection();
  if (section === "admin") return "Admin";
  if (section === "layout") {
    const key = routeKey || "";
    const literal = pathLiteral || "";
    if (
      (componentPath && componentPath.includes("ServiceDistributer")) ||
      key.startsWith("SERVICE_DISTRIBUTER") ||
      [
        "STATION_WORKERS",
        "STATION_WORKER_DETAILS",
        "STATIONS",
        "ADD_STATIONS",
        "STATIONS_DETAILS",
        "FUEL_STATION_REQUESTS",
        "FUEL_STATION_REQUESTS_DETAILS",
      ].includes(key) ||
      literal.includes("service-distributer")
    ) {
      return "Distributor";
    }
    return "Company";
  }
  return null;
}

function processRoute(buffer) {
  const section = currentSection();
  if (!section) return;
  const elementMatch = buffer.match(/element={<([A-Za-z0-9_]+)/);
  if (!elementMatch) return;
  const componentName = elementMatch[1];
  const keyMatch = buffer.match(/path={ROUTES\.([A-Z0-9_]+)}/);
  const literalMatch = buffer.match(/path="([^"]+)"/);
  const routeKey = keyMatch ? keyMatch[1] : null;
  const pathLiteral = literalMatch ? literalMatch[1] : null;
  if (shouldSkipRoute({ routeKey, pathLiteral, componentName })) return;
  const analysis = getComponentAnalysis(componentName);
  const dashboard = categorizeDashboard(routeKey, pathLiteral, analysis.filePath || "");
  if (!dashboard) return;
  const displayName =
    (routeKey && formatRouteKey(routeKey)) ||
    (pathLiteral && formatPathLiteral(pathLiteral)) ||
    formatComponentName(componentName);
  if (!displayName) return;
  if (seenNames[dashboard].has(displayName)) return;
  seenNames[dashboard].add(displayName);
  dashboards[dashboard].push({
    name: displayName,
    componentName,
    uiStatus: analysis.uiStatus,
    fetchStatus: analysis.fetchStatus,
  });
}

for (const line of lines) {
  if (routeBuffer !== null) {
    routeBuffer += "\n" + line;
    if (line.includes("/>") && !line.includes("</Route>")) {
      processRoute(routeBuffer);
      routeBuffer = null;
    }
    if (line.includes("</Route>")) {
      routeBuffer = null;
      stack.pop();
    }
    continue;
  }
  if (line.includes("<Route element={<AdminLayoutWrapper />}>")) {
    stack.push("admin");
    continue;
  }
  if (line.includes("<Route element={<LayoutWrapper />}>") || line.includes("<Route element={<LayoutWrapper />}")) {
    stack.push("layout");
    continue;
  }
  if (line.includes("</Route>")) {
    if (stack.length) stack.pop();
    continue;
  }
  if (line.includes("<Route")) {
    routeBuffer = line;
    if (line.includes("/>") && !line.includes("</Route>")) {
      processRoute(routeBuffer);
      routeBuffer = null;
    }
  }
}

function printDashboard(name) {
  console.log(`${name} Dashboard:`);
  const entries = dashboards[name];
  if (!entries.length) {
    console.log("- No pages detected");
  } else {
    entries.forEach((entry) => {
      console.log(`- ${entry.name} (UI: ${entry.uiStatus}, Fetching: ${entry.fetchStatus})`);
    });
  }
  console.log("");
}

printDashboard("Admin");
printDashboard("Company");
printDashboard("Distributor");
