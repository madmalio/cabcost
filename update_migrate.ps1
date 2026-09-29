$lines = Get-Content internal/db/migrate.go
$newLines = @()
$inMigrate = $false
foreach ($line in $lines) {
    if ($line -match "if version < 4 {") {
        $inMigrate = $true
    }
    if ($inMigrate -and $line -match "^\s+return nil" -and $lines[$lines.IndexOf($line) - 1] -match "}") {
        $newLines += "	if version < 5 {"
        $newLines += "		if err := migrateDataV5(database); err != nil {"
        $newLines += "			return err"
        $newLines += "		}"
        $newLines += "		if err := setUserVersion(database, 5); err != nil {"
        $newLines += "			return err"
        $newLines += "		}"
        $newLines += "	}"
        $inMigrate = $false
    }
    $newLines += $line
}
Set-Content -Path internal/db/migrate.go -Value $newLines
