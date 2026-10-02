export function formatStage(stage) {
  return stage
    .split("_")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
}