# Rancher Extension

Этот каталог содержит development app и сам Rancher UI extension для cluster-level продукта `scanner`.

Что уже есть:

- overview page со статусом сканера
- ручной запуск scan
- latest report
- history runs
- storage info для локального хранилища сканера

Структура:

- `package.json`: development app для локального запуска Rancher shell
- `pkg/k8s-scanner-cluster`: сам extension package

## Рабочий режим

Самый надёжный путь для разработки и проверки extension:

```bash
cd /home/skade/k8s_scanner/rancher-extension
cp .env.example .env
yarn install
yarn dev
```

В `.env` нужно указать URL Rancher backend:

```bash
API=https://your-rancher.example.com
```

После старта открывай:

```text
https://127.0.0.1:8005
```

В этом режиме Rancher shell поднимается локально, а extension автоматически загружается из `pkg/k8s-scanner-cluster`. Это основной режим разработки, и именно его нужно считать базовым рабочим сценарием.

## Developer Load

Если нужно загрузить собранный bundle в уже открытый Rancher UI:

```bash
cd /home/skade/k8s_scanner/rancher-extension
rm -rf dist-pkg
yarn build-pkg k8s-scanner-cluster
yarn serve-pkgs
```

После этого появится bundle в `dist-pkg/k8s-scanner-cluster-<version>/` и локальный сервер на `http://127.0.0.1:4500`.

Важно:

- в Rancher надо включить `Preferences -> Advanced Features -> Enable Extension developer features`
- если Rancher открыт по `https`, браузер может блокировать прямую загрузку bundle с `http://127.0.0.1:4500` как mixed content
- поэтому для реальной повседневной работы удобнее использовать `yarn dev`, а `Developer Load` считать вспомогательным режимом

## Что важно

- extension зарегистрирован как cluster-level product и живёт по пути `/c/<cluster>/scanner/overview`
- по умолчанию extension ходит в scanner backend через Rancher proxy:
  `/k8s/clusters/<cluster>/api/v1/namespaces/kubescape-outline-scanner/services/http:kubescape-outline-scanner:8080/proxy`
- если нужен другой endpoint, его можно задать прямо в UI; override хранится в `localStorage`
