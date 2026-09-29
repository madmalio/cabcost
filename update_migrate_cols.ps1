$lines = Get-Content internal/db/migrate.go
$newLines = @()
foreach ($line in $lines) {
    if ($line -match "version, err := userVersion\(database\)") {
        $newLines += "	if err := addColumnIfMissing(database, "materials", "species", "TEXT DEFAULT 'paint_grade'"); err != nil {"
        $newLines += "		return err"
        $newLines += "	}"
        $newLines += "	if err := addColumnIfMissing(database, "quotes", "wood_species", "TEXT DEFAULT 'paint_grade'"); err != nil {"
        $newLines += "		return err"
        $newLines += "	}"
        $newLines += "	if err := addColumnIfMissing(database, "quotes", "finish_type", "TEXT DEFAULT 'painted'"); err != nil {"
        $newLines += "		return err"
        $newLines += "	}"
        $newLines += "
"
    }
    $newLines += $line
}
Set-Content -Path internal/db/migrate.go -Value $newLines
