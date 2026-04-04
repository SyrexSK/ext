<template>
  <div class="scanner-history">
    <header class="scanner-history__header">
      <div>
        <h1>История сканов</h1>
        <p>Последние сохранённые scan runs и локальные префиксы артефактов.</p>
      </div>
      <button
        class="btn role-secondary"
        :disabled="loading"
        @click="refresh"
      >
        Обновить
      </button>
    </header>

    <div
      v-if="error"
      class="scanner-alert scanner-alert--error"
    >
      {{ error }}
    </div>

    <section class="scanner-panel">
      <table
        v-if="history.length"
        class="scanner-table"
      >
        <thead>
          <tr>
            <th>Started</th>
            <th>Status</th>
            <th>Findings</th>
            <th>Duration</th>
            <th>Run ID</th>
            <th>Directory</th>
            <th>Prefix</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in history"
            :key="item.run_id"
          >
            <td>{{ formatDate(item.started_at) }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.findings_count }}</td>
            <td>{{ item.duration_seconds }}s</td>
            <td>{{ item.run_id }}</td>
            <td>{{ item.artifacts?.storage_directory || 'n/a' }}</td>
            <td>{{ item.artifacts?.prefix || 'n/a' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        История ещё не загружена.
      </p>
    </section>
  </div>
</template>

<script>
import { fetchHistory } from '../api/scanner';

export default {
  name: 'K8sScannerHistoryPage',

  data() {
    return {
      error: '',
      history: [],
      loading: false,
    };
  },

  computed: {
    clusterId() {
      return this.$route.params.cluster;
    },
  },

  created() {
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
        this.history = await fetchHistory(50, this.clusterId);
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.scanner-history {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.scanner-history__header {
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.scanner-history__header h1 {
  margin: 0 0 8px;
}

.scanner-history__header p {
  margin: 0;
}

.scanner-panel {
  background: var(--body-bg, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 12px;
  padding: 16px;
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

.scanner-alert {
  border-radius: 8px;
  padding: 12px;
}

.scanner-alert--error {
  background: #fff4f4;
  color: #9f1239;
}
</style>
