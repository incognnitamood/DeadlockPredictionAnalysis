import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# -----------------------------
# 1. Load dataset
# -----------------------------
df = pd.read_csv("master_dataset.csv")

print("\n===== BASIC DATA INFO =====")
print(df.info())

print("\n===== SAMPLE ROWS =====")
print(df.head())

# -----------------------------
# 2. Label & source distribution
# -----------------------------
print("\n===== LABEL DISTRIBUTION =====")
print(df["label"].value_counts())

print("\n===== SOURCE DISTRIBUTION =====")
print(df["source"].value_counts())

# -----------------------------
# 3. Group-wise statistics
# -----------------------------
group_stats = df.groupby("label")[
    ["cpu_percent", "memory_percent", "disk_percent", "deadlock_risk"]
].mean()

print("\n===== AVERAGE SYSTEM LOAD BY LABEL =====")
print(group_stats)

# -----------------------------
# 4. Correlation analysis
# -----------------------------
features = [
    "cpu_percent",
    "memory_percent",
    "disk_percent",
    "total_allocated",
    "total_need",
    "deadlock_risk"
]

corr = df[features].corr()

print("\n===== CORRELATION MATRIX =====")
print(corr)

# -----------------------------
# 5. Visualization
# -----------------------------
sns.set(style="whitegrid")

# CPU vs Label
plt.figure()
sns.boxplot(x="label", y="cpu_percent", data=df)
plt.title("CPU Usage vs System State")
plt.savefig("cpu_vs_label.png")
plt.show()

# Memory vs Label
plt.figure()
sns.boxplot(x="label", y="memory_percent", data=df)
plt.title("Memory Usage vs System State")
plt.savefig("memory_vs_label.png")
plt.show()

# Deadlock Risk Distribution
plt.figure()
sns.histplot(df["deadlock_risk"], bins=20, kde=True)
plt.title("Deadlock Risk Distribution")
plt.savefig("deadlock_risk_distribution.png")
plt.show()

# Total Need vs Total Allocation
plt.figure()
sns.scatterplot(
    x="total_allocated",
    y="total_need",
    hue="label",
    data=df
)
plt.title("Total Allocation vs Total Need")
plt.savefig("allocation_vs_need.png")
plt.show()

# Heatmap
plt.figure(figsize=(8, 6))
sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Feature Correlation Heatmap")
plt.savefig("correlation_heatmap.png")
plt.show()

print("\n✅ Phase 1 EDA complete.")
print("📊 Generated plots:")
print(" - cpu_vs_label.png")
print(" - memory_vs_label.png")
print(" - deadlock_risk_distribution.png")
print(" - allocation_vs_need.png")
print(" - correlation_heatmap.png")
