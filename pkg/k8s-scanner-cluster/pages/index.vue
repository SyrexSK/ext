<template>
  <div class="scanner-page">
    <header class="scanner-page__header">
      <div>
        <h1>CVE-Containers</h1>
        <p>Управление сканами и быстрый просмотр последнего результата.</p>
      </div>
      <div class="scanner-page__actions">
        <button
          class="btn role-primary"
          :disabled="scanSubmitting"
          @click="runScan"
        >
          {{ scanSubmitting ? 'Запуск...' : 'Запустить сканирование' }}
        </button>
        <button
          class="btn role-secondary"
          :disabled="loading"
          @click="refresh"
        >
          Обновить
        </button>
      </div>
    </header>

    <section class="scanner-panel">
      <div class="scanner-field">
        <label for="apiBaseUrl">Scanner API base URL</label>
        <div class="scanner-field__row">
          <input
            id="apiBaseUrl"
            v-model="apiBaseUrlInput"
            type="text"
            class="scanner-input"
            placeholder="/k8s-scanner-api"
          >
          <button
            class="btn role-secondary"
            @click="saveApiBaseUrl"
          >
            Сохранить
          </button>
        </div>
      </div>
      <div
        v-if="error"
        class="scanner-alert scanner-alert--error"
      >
        {{ error }}
      </div>
    </section>

    <section class="scanner-grid">
      <article class="scanner-card">
        <h2>Статус</h2>
        <dl v-if="status">
          <div>
            <dt>Service</dt>
            <dd>{{ status.service_status }}</dd>
          </div>
          <div>
            <dt>Scan in progress</dt>
            <dd>{{ status.scan_in_progress ? 'yes' : 'no' }}</dd>
          </div>
          <div>
            <dt>Последний запуск</dt>
            <dd>{{ formatDate(status.last_scan_time) }}</dd>
          </div>
          <div>
            <dt>Последний status</dt>
            <dd>{{ status.last_scan_status || 'unknown' }}</dd>
          </div>
          <div>
            <dt>Findings</dt>
            <dd>{{ status.last_scan_findings_count }}</dd>
          </div>
          <div>
            <dt>Run ID</dt>
            <dd>{{ status.last_scan_run_id || 'n/a' }}</dd>
          </div>
        </dl>
      </article>

      <article class="scanner-card">
        <h2>Хранилище</h2>
        <dl v-if="storageInfo">
          <div>
            <dt>Backend</dt>
            <dd>{{ storageInfo.backend || 'disabled' }}</dd>
          </div>
          <div>
            <dt>Directory</dt>
            <dd>{{ storageInfo.storage_directory || 'n/a' }}</dd>
          </div>
        </dl>
      </article>

      <article class="scanner-card">
        <h2>Последний отчёт</h2>
        <dl v-if="latestReport && latestReport.summary">
          <div>
            <dt>Total findings</dt>
            <dd>{{ latestReport.summary.total_findings }}</dd>
          </div>
          <div>
            <dt>Affected workloads</dt>
            <dd>{{ latestReport.summary.affected_workloads }}</dd>
          </div>
          <div>
            <dt>Affected containers</dt>
            <dd>{{ latestReport.summary.affected_containers }}</dd>
          </div>
        </dl>
        <p v-else>
          Последний отчёт ещё не загружен.
        </p>
      </article>
    </section>

    <section class="scanner-panel">
      <div class="scanner-panel__title">
        <h2>Severity</h2>
      </div>
      <div
        v-if="severityEntries.length"
        class="scanner-severity"
      >
        <div
          v-for="entry in severityEntries"
          :key="entry[0]"
          class="scanner-severity__item"
        >
          <span>{{ entry[0] }}</span>
          <strong>{{ entry[1] }}</strong>
        </div>
      </div>
      <p v-else>
        Нет данных по severity.
      </p>
    </section>

    <section class="scanner-panel">
      <div class="scanner-panel__title">
        <h2>Последние findings</h2>
      </div>
      <table
        v-if="latestItems.length"
        class="scanner-table"
      >
        <thead>
          <tr>
            <th>Namespace</th>
            <th>Workload</th>
            <th>Container</th>
            <th>Severity</th>
            <th>Issue</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in latestItems"
            :key="`${item.namespace}-${item.workload_name}-${item.issue_id}-${item.title}`"
          >
            <td>{{ item.namespace || 'cluster-scoped' }}</td>
            <td>{{ item.workload_kind }}/{{ item.workload_name }}</td>
            <td>{{ item.container_name || 'resource' }}</td>
            <td>{{ item.severity }}</td>
            <td>{{ item.issue_id }}</td>
            <td>{{ item.title }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        Findings пока нет.
      </p>
    </section>
  </div>
</template>

<script>
import {
  fetchLatestReport,
  fetchStatus,
  fetchStorageInfo,
  getApiBaseUrl,
  setApiBaseUrl,
  triggerScan,
} from '../api/scanner';

export default {
  name: 'K8sScannerOverviewPage',

  data() {
    return {
      apiBaseUrlInput: '',
      error: '',
      latestReport: null,
      loading: false,
      scanSubmitting: false,
      status: null,
      storageInfo: null,
    };
  },

  computed: {
    clusterId() {
      return this.$route.params.cluster;
    },

    latestItems() {
      return (this.latestReport?.items || []).slice(0, 25);
    },

    severityEntries() {
      return Object.entries(this.latestReport?.summary?.severity_counts || {});
    },
  },

  created() {
    this.apiBaseUrlInput = getApiBaseUrl(this.clusterId);
    this.refresh();
  },

  methods: {
    formatDate(value) {
      if (!value) {
        return 'n/a';
      }

      return new Date(value).toLocaleString();
    },

    async refresh() {
      this.loading = true;
      this.error = '';

      try {
        const [status, latestReport, storageInfo] = await Promise.all([
          fetchStatus(this.clusterId),
          fetchLatestReport(this.clusterId),
          fetchStorageInfo(this.clusterId),
        ]);

        this.status = status;
        this.latestReport = latestReport;
        this.storageInfo = storageInfo;
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err);
      } finally {
        this.loading = false;
      }
    },

    saveApiBaseUrl() {
      this.apiBaseUrlInput = setApiBaseUrl(this.apiBaseUrlInput, this.clusterId);
      this.refresh();
    },

    async runScan() {
      this.scanSubmitting = true;
      this.error = '';

      try {
        await triggerScan(this.clusterId);
        await this.refresh();
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err);
      } finally {
        this.scanSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.scanner-page {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.scanner-page__header {
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.scanner-page__header h1 {
  margin: 0 0 8px;
}

.scanner-page__header p {
  margin: 0;
}

.scanner-page__actions {
  display: flex;
  gap: 8px;
}

.scanner-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.scanner-card,
.scanner-panel {
  background: var(--body-bg, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 12px;
  padding: 16px;
}

.scanner-card h2,
.scanner-panel h2 {
  margin: 0 0 12px;
}

.scanner-card dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.scanner-card dl div {
  display: grid;
  gap: 4px;
}

.scanner-card dt {
  color: var(--text-muted, #667085);
  font-size: 12px;
  margin: 0;
  text-transform: uppercase;
}

.scanner-card dd {
  margin: 0;
}

.scanner-field {
  display: grid;
  gap: 8px;
}

.scanner-field__row {
  display: flex;
  gap: 8px;
}

.scanner-input {
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
}

.scanner-alert {
  border-radius: 8px;
  margin-top: 12px;
  padding: 12px;
}

.scanner-alert--error {
  background: #fff4f4;
  color: #9f1239;
}

.scanner-severity {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.scanner-severity__item {
  background: #f8fafc;
  border-radius: 10px;
  display: grid;
  gap: 6px;
  padding: 12px;
}

.scanner-table {
  border-collapse: collapse;
  width: 100%;
}

.scanner-table th,
.scanner-table td {
  border-bottom: 1px solid var(--border, #d9d9d9);
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}
</style>
