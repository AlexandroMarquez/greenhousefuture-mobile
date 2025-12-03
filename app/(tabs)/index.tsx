import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

// Base de Firebase
const FIREBASE_BASE =
  "https://greenhousefuture-73514-default-rtdb.firebaseio.com/";
const METRICS_PATH = "esp32/metrics";
const FIREBASE_METRICS_URL = `${FIREBASE_BASE}${METRICS_PATH}.json`;

const POLL_MS = 5000;

export default function HomeScreen() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // estados de actuadores (switches)
  const [lightOn, setLightOn] = useState<boolean | null>(null);
  const [pumpOn, setPumpOn] = useState<boolean | null>(null);
  const [ventOn, setVentOn] = useState<boolean | null>(null);
  const [humidOn, setHumidOn] = useState<boolean | null>(null);

  async function fetchMetrics(manual = false) {
    try {
      if (manual) setRefreshing(true);
      setError(null);

      const res = await fetch(FIREBASE_METRICS_URL + "?ts=" + Date.now(), {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      setMetrics(data);
      setLastUpdate(new Date());

      // sincronizar estados de actuadores desde JSON
      if (data?.grow_light && typeof data.grow_light.commanded_on === "boolean") {
        setLightOn(!!data.grow_light.commanded_on);
      }
      if (
        data?.irrigation_pump &&
        typeof data.irrigation_pump.commanded_on === "boolean"
      ) {
        setPumpOn(!!data.irrigation_pump.commanded_on);
      }
      if (
        data?.ventilation_fan &&
        typeof data.ventilation_fan.commanded_on === "boolean"
      ) {
        setVentOn(!!data.ventilation_fan.commanded_on);
      }
      if (
        data?.humidifier &&
        typeof data.humidifier.commanded_on === "boolean"
      ) {
        setHumidOn(!!data.humidifier.commanded_on);
      }
    } catch (err) {
      console.log(err);
      setError("Error obteniendo métricas desde Firebase");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // función genérica para actualizar el comando de un actuador
  async function updateCommand(path: string, commanded_on: boolean) {
    try {
      setError(null);
      const url = `${FIREBASE_BASE}${METRICS_PATH}/${path}.json`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commanded_on }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.log(err);
      setError("Error actualizando comando en Firebase");
    }
  }

  // handlers de cada switch
  const handleToggleLight = async (value: boolean) => {
    setLightOn(value);
    await updateCommand("grow_light", value);
  };

  const handleTogglePump = async (value: boolean) => {
    setPumpOn(value);
    await updateCommand("irrigation_pump", value);
  };

  const handleToggleVent = async (value: boolean) => {
    setVentOn(value);
    await updateCommand("ventilation_fan", value);
  };

  const handleToggleHumid = async (value: boolean) => {
    setHumidOn(value);
    await updateCommand("humidifier", value);
  };

  useEffect(() => {
    fetchMetrics(false);
    const id = setInterval(() => fetchMetrics(false), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const m = metrics ?? {};
  const air = m.air_conditions ?? {};
  const soil = m.soil_moisture ?? {};
  const tank = m.water_tank_level ?? {};
  const light = m.ambient_light ?? {};

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerIcon}>🌱</Text>
        <Text style={styles.headerTitle}>Greenhouse Future</Text>
        <Text style={styles.headerSubtitle}>
          {lastUpdate ? `· ${lastUpdate.toLocaleTimeString("es-CL")}` : "· cargando…"}
        </Text>
      </View>

      {error && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMetrics(true)}
          />
        }
      >
        {loading && !metrics ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Cargando métricas…</Text>
          </View>
        ) : (
          <>
            <Card
              label="Temperatura aire"
              value={air.temperature_c}
              unit="°C"
              status={air.status}
            />

            <Card
              label="Humedad relativa"
              value={air.relative_humidity_pct}
              unit="%"
              status={air.status}
            />

            <Card
              label="Humedad suelo"
              value={soil.percent}
              unit="%"
              status={soil.status}
            />

            <Card
              label="Nivel agua de riego"
              value={
                tank.status === "nivel_optimo"
                  ? "Óptimo"
                  : tank.status === "agua_insuficiente"
                  ? "Bajo"
                  : "–"
              }
              unit=""
              status={
                tank.status === "nivel_optimo"
                  ? "ok"
                  : tank.status === "agua_insuficiente"
                  ? "bad"
                  : "muted"
              }
            />

            <Card
              label="Luz ambiental"
              value={light.percent}
              unit="%"
              status={light.status}
            />

            {/* CONTROL MANUAL DE ACTUADORES */}
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.cardLabel}>Control manual</Text>

              <SwitchRow
                label="Luz artificial"
                value={lightOn}
                onChange={handleToggleLight}
              />
              <SwitchRow
                label="Bomba de riego"
                value={pumpOn}
                onChange={handleTogglePump}
              />
              <SwitchRow
                label="Ventilación"
                value={ventOn}
                onChange={handleToggleVent}
              />
              <SwitchRow
                label="Humidificador"
                value={humidOn}
                onChange={handleToggleHumid}
              />
            </View>

            {/* DEBUG JSON */}
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.cardLabel}>Debug JSON</Text>
              <ScrollView style={styles.jsonBox} horizontal>
                <Text style={styles.jsonText}>
                  {JSON.stringify(metrics, null, 2)}
                </Text>
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Greenhouse Future · Firebase Viewer
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Card({ label, value, unit, status }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.row}>
        <View style={styles.row}>
          <Text style={styles.valueText}>
            {typeof value === "number" ? value : value ?? "–"}
          </Text>
          {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
        </View>
        <Badge status={status} />
      </View>
    </View>
  );
}

function Badge({ status }: any) {
  const map = {
    ok: styles.badgeOk,
    bad: styles.badgeBad,
    warn: styles.badgeWarn,
    muted: styles.badgeMuted,
  };

  return (
    <View style={[styles.badgeBase, map[status] ?? map["muted"]]}>
      <Text style={styles.badgeText}>
        {status === "ok"
          ? "óptimo"
          : status === "bad"
          ? "crítico"
          : status === "warn"
          ? "alerta"
          : "sin dato"}
      </Text>
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  const enabled = value !== null;

  return (
    <View style={[styles.row, { marginTop: 10 }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onChange}
        disabled={!enabled}
        thumbColor={value ? "#22c55e" : "#e5e7eb"}
        trackColor={{ false: "#4b5563", true: "#15803d" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1220" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  headerIcon: { fontSize: 22, marginRight: 6 },
  headerTitle: { color: "#e5e7eb", fontSize: 18, fontWeight: "800" },
  headerSubtitle: { color: "#9ca3af", marginLeft: 6 },

  scroll: { flex: 1 },

  card: {
    backgroundColor: "#0e1b12",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2b3a2f",
    marginBottom: 12,
  },

  cardLabel: { color: "#9ca3af", marginBottom: 4, fontSize: 14 },
  valueText: { color: "#e5e7eb", fontSize: 28, fontWeight: "bold" },
  unitText: { color: "#9ca3af", fontSize: 14, marginLeft: 4 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badgeBase: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { color: "#fff" },

  badgeOk: {
    backgroundColor: "rgba(22,163,74,0.2)",
    borderColor: "rgba(22,163,74,0.4)",
  },
  badgeBad: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  badgeWarn: {
    backgroundColor: "rgba(245,158,11,0.2)",
    borderColor: "rgba(245,158,11,0.4)",
  },
  badgeMuted: {
    backgroundColor: "rgba(148,163,184,0.2)",
    borderColor: "rgba(148,163,184,0.4)",
  },

  jsonBox: {
    maxHeight: 200,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
  },

  jsonText: { color: "#e5e7eb", fontSize: 12 },
  footer: {
    padding: 10,
    borderTopColor: "#1f2937",
    borderTopWidth: 1,
  },
  footerText: { textAlign: "center", color: "#9ca3af" },

  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
  },
  bannerError: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
  },
  bannerText: { color: "#fecaca", fontSize: 13 },

  loadingBox: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#e5e7eb", marginTop: 10 },
});
