# shellcheck shell=bash
# Sourced, not executed, by .aidev/run-checks.sh.
# The node -e program is single-quoted on purpose: its ${...} are JS template
# literals, not shell expansions.
# shellcheck disable=SC2016
#
# junit_write_cases JUNIT SUITE CASES
#   For a suite whose cases are steps of a script rather than a test runner's
#   tests. CASES is a file of tab-separated lines the script appended as it went:
#     case<TAB>NAME<TAB>pass|fail|skip<TAB>SECONDS<TAB>MESSAGE[<TAB>LOG]
#     property<TAB>NAME<TAB>VALUE
#   Writes JUNIT as one testsuite SUITE: a case per `case` line, its failure body
#   the tail of LOG when given, and every `property` on the testsuite.
junit_write_cases() {
    JUNIT="$1" SUITE="$2" CASES="$3" node -e '
const fs = require("fs");
const { JUNIT, SUITE, CASES } = process.env;
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" })[c]);
const tail = (log) => {
  if (!log || !fs.existsSync(log)) return "";
  return fs.readFileSync(log, "utf8").replace(/\x1b\[[0-9;]*[A-Za-z]/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").split("\n").slice(-80).join("\n");
};
const cases = [];
const props = [];
for (const line of fs.readFileSync(CASES, "utf8").split("\n")) {
  const [kind, ...f] = line.split("\t");
  if (kind === "case") cases.push({ name: f[0], status: f[1], time: Number(f[2]) || 0, message: f[3] || "", log: f[4] });
  else if (kind === "property") props.push({ name: f[0], value: f[1] ?? "" });
}
const count = (s) => cases.filter((c) => c.status === s).length;
const time = cases.reduce((t, c) => t + c.time, 0);
const body = cases.map((c) => {
  const open = `<testcase classname="${esc(SUITE)}" name="${esc(c.name)}" time="${c.time}">`;
  if (c.status === "fail") return `${open}<failure message="${esc(c.message)}">${esc(tail(c.log))}</failure></testcase>`;
  if (c.status === "skip") return `${open}<skipped message="${esc(c.message)}"/></testcase>`;
  return `${open}</testcase>`;
});
const properties = props.length
  ? `<properties>\n${props.map((p) => `<property name="${esc(p.name)}" value="${esc(p.value)}"/>`).join("\n")}\n</properties>\n`
  : "";
fs.mkdirSync(require("path").dirname(JUNIT), { recursive: true });
fs.writeFileSync(JUNIT,
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<testsuite name="${esc(SUITE)}" tests="${cases.length}" failures="${count("fail")}" errors="0" skipped="${count("skip")}" time="${time}">\n` +
  properties + body.join("\n") + `\n</testsuite>\n`);
' < /dev/null
}
