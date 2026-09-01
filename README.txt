Today's Starry Sky v8 - Orientation Polarity Fix

変更点
- 通常モード: 太陽・月・惑星・恒星・星座線の方位投影を統一し、シミュレーション時の画面上の回転方向を修正。
- ジャイロモード: 左右・上下・端末回転の全軸で、端末を動かした方向へ星空が追従するよう投影極性を修正。
- ジャイロモード: deviceorientationabsolute を優先し、通常の deviceorientation をフォールバックとして使用。
- センサー非対応またはセンサー値が届かない場合は、ジャイロ開始を成功扱いにしない。
- 横画面を含む診断用 screenAngle が実際の姿勢変換に反映されるよう修正。

実装構成
- 通常モードは、修正版Scratchプロジェクトを index.html 内に埋め込み、TurboWarp互換ランタイムで実行。
- ジャイロモードは、Scratchとは別のCanvas/JavaScript実装。
- 「Today's Starry sky remix(1).sb3」は改変前の原本確認用。index.html は内部に別の修正版プロジェクトを保持している。

公開方法
GitHubリポジトリ直下の index.html と README.txt をこの版へ差し替える。
