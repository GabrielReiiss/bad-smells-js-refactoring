const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

function isAdmin(user) {
  return user.role === 'ADMIN';
}

function markPriority(item, user) {
  if (isAdmin(user) && item.value > ADMIN_PRIORITY_THRESHOLD) {
    item.priority = true;
  }
}

function canView(item, user) {
  return (
    isAdmin(user) ||
    (user.role === 'USER' && item.value <= USER_MAX_VISIBLE_VALUE)
  );
}

function selectVisibleItems(items, user) {
  const visibleItems = [];
  for (const item of items) {
    markPriority(item, user);
    if (canView(item, user)) {
      visibleItems.push(item);
    }
  }
  return visibleItems;
}

function sumValues(items) {
  return items.reduce((total, item) => total + item.value, 0);
}

const csvFormatter = {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  },
  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  },
  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  },
};

const htmlFormatter = {
  header(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  },
  row(item, user) {
    const style =
      isAdmin(user) && item.priority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  },
  footer(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  },
};

// Formato desconhecido gera um relatório vazio.
const emptyFormatter = {
  header: () => '',
  row: () => '',
  footer: () => '',
};

const formatters = new Map([
  ['CSV', csvFormatter],
  ['HTML', htmlFormatter],
]);

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = formatters.get(reportType) ?? emptyFormatter;
    const header = formatter.header(user);
    const visibleItems = selectVisibleItems(items, user);
    const rows = visibleItems.map((item) => formatter.row(item, user)).join('');
    const footer = formatter.footer(sumValues(visibleItems));

    return (header + rows + footer).trim();
  }
}
