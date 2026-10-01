<?php

/**
 * @file
 * Xuất phiếu trả khách hàng ra file Excel (.xlsx thật, không cần thư viện ngoài — tự dựng SpreadsheetML rồi nén bằng ZipArchive).
 *
 * Sheet 1 "Bảng kê": tiêu đề, thông tin khách hàng + phiếu, bảng kế hoạch (STT, ngày KH, BKG, cont, loại cont, tuyến,
 * doanh thu, chi hộ KH, tổng), dòng tổng (công thức SUM), số tiền bằng chữ, khối chữ ký.
 * Sheet 2 "Chi tiết khoản thu": từng dòng doanh thu / chi hộ KH của từng kế hoạch (theo dữ liệu kế hoạch lúc tải file).
 * Số tiền ở sheet 1 = số trên phiếu (đã chốt nếu khách đã duyệt; chờ duyệt thì tính theo kế hoạch hiện tại — xem _ptkh_load()).
 */

/** Gửi file .xlsx của phiếu (đã nạp bằng _ptkh_load($id, TRUE)). Trả FALSE nếu máy chủ không có ZipArchive (để dùng cách xuất cũ). */
function _ptkh_export_xlsx(array $row) {
  if (!class_exists('ZipArchive')) return FALSE;

  $customer = _ptkh_export_customer((int) $row['nid_khach_hang']);
  $plan_ids = array();
  foreach ($row['items'] as $item) $plan_ids[] = (int) $item['nid_ke_hoach'];

  $sheets = array(
    array('name' => 'Bảng kê', 'xml' => _ptkh_export_sheet_summary($row, $customer)),
    array('name' => 'Chi tiết khoản thu', 'xml' => _ptkh_export_sheet_detail($row, $plan_ids)),
  );

  $tmp = tempnam(file_directory_temp(), 'ptkh');
  $zip = new ZipArchive();
  if ($zip->open($tmp, ZipArchive::OVERWRITE) !== TRUE) return FALSE;
  $zip->addFromString('[Content_Types].xml', _ptkh_export_content_types(count($sheets)));
  $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    . '</Relationships>');
  $zip->addFromString('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    . '<dc:title>' . _ptkh_x('Phiếu trả khách hàng ' . $row['ma_phieu']) . '</dc:title>'
    . '<dc:creator>' . _ptkh_x(_ptkh_export_company_name()) . '</dc:creator>'
    . '<dcterms:created xsi:type="dcterms:W3CDTF">' . gmdate('Y-m-d\TH:i:s\Z') . '</dcterms:created>'
    . '</cp:coreProperties>');
  $zip->addFromString('xl/workbook.xml', _ptkh_export_workbook($sheets));
  $rels = '';
  foreach ($sheets as $i => $sheet) {
    $rels .= '<Relationship Id="rId' . ($i + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . ($i + 1) . '.xml"/>';
    $zip->addFromString('xl/worksheets/sheet' . ($i + 1) . '.xml', $sheet['xml']);
  }
  $rels .= '<Relationship Id="rId' . (count($sheets) + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
  $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . $rels . '</Relationships>');
  $zip->addFromString('xl/styles.xml', _ptkh_export_styles());
  $zip->close();

  $file_name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $row['ma_phieu'] . ($customer['ma_kh'] !== '' ? '_' . $customer['ma_kh'] : '')) . '.xlsx';
  drupal_add_http_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  drupal_add_http_header('Content-Disposition', 'attachment; filename="' . $file_name . '"');
  drupal_add_http_header('Content-Length', (string) filesize($tmp));
  drupal_add_http_header('Cache-Control', 'private, max-age=0');
  drupal_send_headers();
  readfile($tmp);
  @unlink($tmp);
  return TRUE;
}

/* ---------------------------------------------------------------------------
 * Nội dung 2 sheet
 * ------------------------------------------------------------------------- */

/** Sheet "Bảng kê" — cột A..I. */
function _ptkh_export_sheet_summary(array $row, array $customer) {
  $s = _ptkh_export_style_ids();
  $rows = array();
  $merges = array();
  $heights = array();
  $r = 0;

  // Tiêu đề.
  $r++;
  $rows[$r] = array(_ptkh_c("A$r", mb_strtoupper(_ptkh_export_company_name()), $s['company']));
  $merges[] = "A$r:I$r";
  $r++;
  $rows[$r] = array(_ptkh_c("A$r", 'BẢNG KÊ CƯỚC VẬN CHUYỂN', $s['title']));
  $merges[] = "A$r:I$r";
  $heights[$r] = 26;
  $r++;
  $rows[$r] = array(_ptkh_c("A$r", 'Phiếu trả khách hàng số ' . $row['ma_phieu'] . ' — ' . _ptkh_export_period($row), $s['subtitle']));
  $merges[] = "A$r:I$r";
  $r++;

  // Khối thông tin: trái = khách hàng (nhãn A:B, giá trị C:E), phải = phiếu (nhãn F, giá trị G:I).
  $left = array(
    // Chỉ tên khách hàng (không kèm mã KH); chưa có tên thì mới dùng mã.
    array('Khách hàng', $customer['ten'] !== '' ? $customer['ten'] : $customer['ma_kh']),
    array('MST / CCCD', $customer['cccd_mst']),
    array('Địa chỉ', $customer['dia_chi']),
    array('Điện thoại / Email', trim($customer['sdt'] . ($customer['sdt'] !== '' && $customer['email'] !== '' ? ' / ' : '') . $customer['email'])),
    array('Số kế hoạch', count($row['items']) . ' kế hoạch'),
  );
  $right = array(
    array('Mã phiếu', $row['ma_phieu']),
    array('Kỳ vận chuyển', _ptkh_export_period($row)),
    array('Trạng thái', _ptkh_status_label($row['trang_thai_duyet'])),
    array('Số hoá đơn / Tháng HT', $row['trang_thai_duyet'] === 'da_duyet' ? trim($row['so_hoa_don'] . ' / ' . _ptkh_export_month($row['thang_hach_toan']), ' /') : '—'),
    array('Ngày lập / Người lập', trim(_ptkh_export_datetime($row['created']) . ' / ' . (!empty($row['nguoi_thuc_hien']['name']) ? $row['nguoi_thuc_hien']['name'] : ''), ' /')),
  );
  foreach ($left as $i => $pair) {
    $r++;
    $rows[$r] = array(
      _ptkh_c("A$r", $pair[0], $s['label']), _ptkh_c("B$r", '', $s['label']),
      _ptkh_c("C$r", $pair[1] !== '' ? $pair[1] : '—', $s['value']), _ptkh_c("D$r", '', $s['value']), _ptkh_c("E$r", '', $s['value']),
      _ptkh_c("F$r", $right[$i][0], $s['label_right']),
      _ptkh_c("G$r", $right[$i][1] !== '' ? $right[$i][1] : '—', $i === 0 ? $s['value_bold'] : $s['value']), _ptkh_c("H$r", '', $s['value']), _ptkh_c("I$r", '', $s['value']),
    );
    $merges[] = "A$r:B$r";
    $merges[] = "C$r:E$r";
    $merges[] = "G$r:I$r";
  }
  if (trim((string) $row['ghi_chu']) !== '') {
    $r++;
    $rows[$r] = array(_ptkh_c("A$r", 'Ghi chú', $s['label']), _ptkh_c("B$r", '', $s['label']), _ptkh_c("C$r", $row['ghi_chu'], $s['value']));
    $merges[] = "A$r:B$r";
    $merges[] = "C$r:I$r";
  }
  $r++;

  // Bảng kế hoạch.
  $r++;
  $header_row = $r;
  $headers = array('STT', 'Ngày KH', 'Số BKG', 'Số cont', 'Loại cont', 'Tuyến', 'Doanh thu (đ)', 'Chi hộ KH (đ)', 'Tổng cộng (đ)');
  $rows[$r] = array();
  foreach ($headers as $i => $h) $rows[$r][] = _ptkh_c(_ptkh_col($i) . $r, $h, $s['th']);
  $heights[$r] = 30;
  $first = $r + 1;
  $stt = 0;
  foreach ($row['items'] as $item) {
    $r++;
    $stt++;
    $rows[$r] = array(
      _ptkh_c("A$r", $stt, $s['td_center']),
      _ptkh_c("B$r", _ptkh_export_date($item['ngay']), $s['td_center']),
      _ptkh_c("C$r", $item['so_bkg'], $s['td']),
      _ptkh_c("D$r", $item['so_cont'], $s['td_bold']),
      _ptkh_c("E$r", $item['loai_cont'], $s['td_center']),
      _ptkh_c("F$r", $item['tuyen'], $s['td_wrap']),
      _ptkh_c("G$r", (int) $item['tong_doanh_thu'], $s['td_money']),
      _ptkh_c("H$r", (int) $item['tong_chi_ho_khach_hang'], $s['td_money']),
      _ptkh_c("I$r", (int) $item['tong_tien'], $s['td_money_bold']),
    );
  }
  $last = max($first, $r);
  if ($stt === 0) {
    $r++;
    $rows[$r] = array(_ptkh_c("A$r", 'Phiếu chưa có kế hoạch', $s['td_center']));
    $merges[] = "A$r:I$r";
    $last = $r;
  }

  // Dòng tổng (công thức SUM để sửa số trong file vẫn tự cộng).
  $r++;
  $rows[$r] = array(_ptkh_c("A$r", 'TỔNG CỘNG (' . $stt . ' kế hoạch)', $s['total_label']));
  foreach (array('B', 'C', 'D', 'E', 'F') as $col) $rows[$r][] = _ptkh_c("$col$r", '', $s['total_label']);
  $rows[$r][] = _ptkh_f("G$r", "SUM(G$first:G$last)", (int) $row['tong_doanh_thu'], $s['total_money']);
  $rows[$r][] = _ptkh_f("H$r", "SUM(H$first:H$last)", (int) $row['tong_chi_ho_khach_hang'], $s['total_money']);
  $rows[$r][] = _ptkh_f("I$r", "SUM(I$first:I$last)", (int) $row['tong_tien'], $s['total_money']);
  $merges[] = "A$r:F$r";
  $heights[$r] = 22;

  $r++;
  $rows[$r] = array(_ptkh_c("A$r", 'Số tiền bằng chữ: ' . _ptkh_so_thanh_chu((int) $row['tong_tien']), $s['words']));
  $merges[] = "A$r:I$r";

  if (!empty($row['chenh_lech_sau_duyet'])) {
    $r++;
    $rows[$r] = array(_ptkh_c("A$r", 'Lưu ý: kế hoạch đã thay đổi sau khi khách duyệt, số hiện tại trên kế hoạch chênh ' . number_format((int) $row['chenh_lech_sau_duyet'], 0, ',', '.') . ' đ so với số đã chốt trên phiếu.', $s['warning']));
    $merges[] = "A$r:I$r";
  }

  // Khối chữ ký.
  $r += 2;
  $blocks = array(array('B', 'C', 'NGƯỜI LẬP PHIẾU'), array('D', 'F', 'KẾ TOÁN'), array('G', 'I', 'XÁC NHẬN CỦA KHÁCH HÀNG'));
  $rows[$r] = array();
  foreach ($blocks as $b) { $rows[$r][] = _ptkh_c($b[0] . $r, $b[2], $s['sign_title']); $merges[] = $b[0] . $r . ':' . $b[1] . $r; }
  $r++;
  $rows[$r] = array();
  foreach ($blocks as $b) { $rows[$r][] = _ptkh_c($b[0] . $r, '(Ký, ghi rõ họ tên)', $s['sign_hint']); $merges[] = $b[0] . $r . ':' . $b[1] . $r; }
  $r += 4;
  if (!empty($row['nguoi_thuc_hien']['name'])) {
    $rows[$r] = array(_ptkh_c("B$r", $row['nguoi_thuc_hien']['name'], $s['sign_name']));
    $merges[] = "B$r:C$r";
  }

  $cols = array(6, 12, 16, 15, 10, 46, 16, 16, 17);
  $filter = $stt ? "A$header_row:I$last" : '';
  return _ptkh_export_sheet_xml($rows, $merges, $cols, $heights, $filter, 0);
}

/** Sheet "Chi tiết khoản thu" — từng dòng doanh thu / chi hộ KH của các kế hoạch trong phiếu. */
function _ptkh_export_sheet_detail(array $row, array $plan_ids) {
  $s = _ptkh_export_style_ids();
  $rows = array();
  $merges = array();
  $plans = array();
  foreach ($row['items'] as $item) $plans[(int) $item['nid_ke_hoach']] = $item;

  $lines = array();
  if ($plan_ids && db_table_exists('ke_hoach_chi_phi')) {
    $lines = db_select('ke_hoach_chi_phi', 'c')
      ->fields('c', array('nid_ke_hoach', 'loai_chi_phi', 'ten_chi_phi', 'don_gia', 'so_luong', 'vat_percent', 'tong_sau_vat', 'ghi_chu'))
      ->condition('c.hoat_dong', 1)
      ->condition('c.nid_ke_hoach', $plan_ids, 'IN')
      ->condition('c.loai_chi_phi', array('doanh_thu', 'tinh_cho_khach'), 'IN')
      ->orderBy('c.nid_ke_hoach', 'ASC')->orderBy('c.loai_chi_phi', 'ASC')->orderBy('c.nid', 'ASC')
      ->execute()->fetchAll();
  }
  // Giữ đúng thứ tự kế hoạch như sheet "Bảng kê".
  $order = array_flip($plan_ids);
  usort($lines, function ($a, $b) use ($order) {
    $oa = isset($order[(int) $a->nid_ke_hoach]) ? $order[(int) $a->nid_ke_hoach] : PHP_INT_MAX;
    $ob = isset($order[(int) $b->nid_ke_hoach]) ? $order[(int) $b->nid_ke_hoach] : PHP_INT_MAX;
    return $oa === $ob ? 0 : ($oa < $ob ? -1 : 1);
  });

  $r = 1;
  $rows[$r] = array(_ptkh_c("A$r", 'CHI TIẾT KHOẢN THU — PHIẾU ' . $row['ma_phieu'], $s['title_small']));
  $merges[] = "A$r:K$r";
  $r++;
  $now_text = function_exists('format_date') ? format_date(REQUEST_TIME, 'custom', 'd/m/Y H:i') : date('d/m/Y H:i');
  $note = 'Theo dữ liệu kế hoạch tại thời điểm tải file (' . $now_text . ').';
  if ($row['trang_thai_duyet'] === 'da_duyet') $note .= ' Phiếu đã chốt số khi khách duyệt — tổng tiền chính thức xem ở sheet "Bảng kê".';
  $rows[$r] = array(_ptkh_c("A$r", $note, $s['subtitle_left']));
  $merges[] = "A$r:K$r";
  $r++;

  $r++;
  $header_row = $r;
  $headers = array('STT', 'Ngày KH', 'Số cont', 'Số BKG', 'Phân loại', 'Tên khoản', 'Đơn giá (đ)', 'SL', 'VAT %', 'Thành tiền sau VAT (đ)', 'Ghi chú');
  $rows[$r] = array();
  foreach ($headers as $i => $h) $rows[$r][] = _ptkh_c(_ptkh_col($i) . $r, $h, $s['th']);
  $heights[$r] = 30;
  $first = $r + 1;
  $stt = 0;
  foreach ($lines as $line) {
    $r++;
    $stt++;
    $plan = isset($plans[(int) $line->nid_ke_hoach]) ? $plans[(int) $line->nid_ke_hoach] : array('ngay' => '', 'so_cont' => '', 'so_bkg' => '');
    $rows[$r] = array(
      _ptkh_c("A$r", $stt, $s['td_center']),
      _ptkh_c("B$r", _ptkh_export_date($plan['ngay']), $s['td_center']),
      _ptkh_c("C$r", $plan['so_cont'], $s['td_bold']),
      _ptkh_c("D$r", $plan['so_bkg'], $s['td']),
      _ptkh_c("E$r", $line->loai_chi_phi === 'doanh_thu' ? 'Doanh thu' : 'Chi hộ KH', $s['td_center']),
      _ptkh_c("F$r", (string) $line->ten_chi_phi, $s['td_wrap']),
      _ptkh_c("G$r", (int) $line->don_gia, $s['td_money']),
      _ptkh_c("H$r", (float) $line->so_luong, $s['td_number']),
      _ptkh_c("I$r", (float) $line->vat_percent, $s['td_number']),
      _ptkh_c("J$r", (int) $line->tong_sau_vat, $s['td_money_bold']),
      _ptkh_c("K$r", (string) $line->ghi_chu, $s['td_wrap']),
    );
  }
  $last = max($first, $r);
  if ($stt === 0) {
    $r++;
    $rows[$r] = array(_ptkh_c("A$r", 'Không có dòng doanh thu / chi hộ khách hàng', $s['td_center']));
    $merges[] = "A$r:K$r";
    $last = $r;
  }
  $r++;
  $rows[$r] = array(_ptkh_c("A$r", 'TỔNG CỘNG (' . $stt . ' dòng)', $s['total_label']));
  foreach (array('B', 'C', 'D', 'E', 'F', 'G', 'H', 'I') as $col) $rows[$r][] = _ptkh_c("$col$r", '', $s['total_label']);
  $sum = 0;
  foreach ($lines as $line) $sum += (int) $line->tong_sau_vat;
  $rows[$r][] = _ptkh_f("J$r", "SUM(J$first:J$last)", $sum, $s['total_money']);
  $rows[$r][] = _ptkh_c("K$r", '', $s['total_label']);
  $merges[] = "A$r:I$r";

  $cols = array(6, 12, 15, 15, 12, 34, 15, 8, 8, 18, 30);
  return _ptkh_export_sheet_xml($rows, $merges, $cols, $heights, $stt ? "A$header_row:K$last" : '', $header_row);
}

/* ---------------------------------------------------------------------------
 * Dữ liệu phụ
 * ------------------------------------------------------------------------- */

function _ptkh_export_customer($nid) {
  $info = array('ma_kh' => '', 'ten' => '', 'cccd_mst' => '', 'dia_chi' => '', 'sdt' => '', 'email' => '');
  if (!$nid || !db_table_exists('khach_hang')) return $info;
  $fields = array();
  foreach (array_keys($info) as $f) if (db_field_exists('khach_hang', $f)) $fields[] = $f;
  $row = db_select('khach_hang', 'kh')->fields('kh', $fields)->condition('kh.nid', (int) $nid)->range(0, 1)->execute()->fetchAssoc();
  if ($row) foreach ($row as $k => $v) $info[$k] = trim((string) $v);
  return $info;
}

/** Tên công ty in trên đầu phiếu: biến ptkh_ten_cong_ty (nếu có đặt), không thì tên site. */
function _ptkh_export_company_name() {
  $name = trim((string) variable_get('ptkh_ten_cong_ty', ''));
  return $name !== '' ? $name : (string) variable_get('site_name', 'TTK Logistics');
}

function _ptkh_export_period(array $row) {
  $from = _ptkh_export_date($row['tu_ngay']);
  $to = _ptkh_export_date($row['den_ngay']);
  if ($from === '' && $to === '') return '—';
  if ($from === $to || $to === '') return 'Ngày ' . $from;
  return 'Từ ' . $from . ' đến ' . $to;
}

function _ptkh_export_date($value) {
  $value = substr((string) $value, 0, 10);
  return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m) ? "$m[3]/$m[2]/$m[1]" : '';
}

function _ptkh_export_datetime($value) {
  $value = (string) $value;
  $date = _ptkh_export_date($value);
  return $date !== '' && strlen($value) >= 16 ? $date . ' ' . substr($value, 11, 5) : $date;
}

function _ptkh_export_month($value) {
  $value = preg_replace('/[^0-9]/', '', (string) $value);
  return strlen($value) === 6 ? substr($value, 4, 2) . '/' . substr($value, 0, 4) : '';
}

/** Đọc số tiền (đồng) thành chữ tiếng Việt, vd 1250000 ⇒ "Một triệu hai trăm năm mươi nghìn đồng". */
function _ptkh_so_thanh_chu($number) {
  $number = (int) round($number);
  if ($number === 0) return 'Không đồng';
  $negative = $number < 0;
  $number = abs($number);
  $digits = array('không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín');
  $units = array('', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ');
  $groups = array();
  while ($number > 0) { $groups[] = $number % 1000; $number = (int) floor($number / 1000); }
  $parts = array();
  for ($i = count($groups) - 1; $i >= 0; $i--) {
    $g = $groups[$i];
    if ($g === 0) continue;
    $h = (int) floor($g / 100); $t = (int) floor(($g % 100) / 10); $u = $g % 10;
    $words = array();
    $has_higher = $i < count($groups) - 1;
    if ($h > 0 || $has_higher) $words[] = $digits[$h] . ' trăm';
    if ($t > 1) {
      $words[] = $digits[$t] . ' mươi';
      if ($u === 1) $words[] = 'mốt';
      elseif ($u === 4) $words[] = 'tư';
      elseif ($u === 5) $words[] = 'lăm';
      elseif ($u > 0) $words[] = $digits[$u];
    }
    elseif ($t === 1) {
      $words[] = 'mười';
      if ($u === 5) $words[] = 'lăm';
      elseif ($u > 0) $words[] = $digits[$u];
    }
    elseif ($u > 0) {
      if ($h > 0 || $has_higher) $words[] = 'lẻ';
      $words[] = $digits[$u];
    }
    $parts[] = implode(' ', $words) . $units[$i];
  }
  $text = implode(' ', $parts) . ' đồng';
  $text = ($negative ? 'âm ' : '') . $text;
  return mb_strtoupper(mb_substr($text, 0, 1)) . mb_substr($text, 1);
}

/* ---------------------------------------------------------------------------
 * Dựng SpreadsheetML
 * ------------------------------------------------------------------------- */

function _ptkh_x($text) {
  // Bỏ ký tự điều khiển XML không hợp lệ rồi escape.
  $text = preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}]/u', '', (string) $text);
  return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

function _ptkh_col($index) {
  $s = '';
  $index++;
  while ($index > 0) { $m = ($index - 1) % 26; $s = chr(65 + $m) . $s; $index = (int) (($index - $m) / 26); }
  return $s;
}

/** 1 ô: số ⇒ kiểu số; chuỗi ⇒ inline string (không cần sharedStrings). */
function _ptkh_c($ref, $value, $style) {
  if (is_int($value) || is_float($value)) {
    return '<c r="' . $ref . '" s="' . (int) $style . '"><v>' . $value . '</v></c>';
  }
  $value = (string) $value;
  if ($value === '') return '<c r="' . $ref . '" s="' . (int) $style . '"/>';
  return '<c r="' . $ref . '" s="' . (int) $style . '" t="inlineStr"><is><t xml:space="preserve">' . _ptkh_x($value) . '</t></is></c>';
}

/** 1 ô công thức (kèm giá trị tính sẵn để xem được cả khi Excel chưa tính lại). */
function _ptkh_f($ref, $formula, $cached, $style) {
  return '<c r="' . $ref . '" s="' . (int) $style . '"><f>' . _ptkh_x($formula) . '</f><v>' . $cached . '</v></c>';
}

/**
 * Ghép XML 1 sheet. $freeze_row > 0: cố định các dòng từ 1 tới dòng đó (dòng tiêu đề bảng luôn thấy khi cuộn).
 * $filter: vùng bật bộ lọc (dòng tiêu đề bảng → dòng dữ liệu cuối).
 */
function _ptkh_export_sheet_xml(array $rows, array $merges, array $cols, array $heights, $filter, $freeze_row) {
  ksort($rows);
  $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    . '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
    . '<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100">';
  if ($freeze_row > 0) {
    $xml .= '<pane ySplit="' . (int) $freeze_row . '" topLeftCell="A' . ((int) $freeze_row + 1) . '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A' . ((int) $freeze_row + 1) . '" sqref="A' . ((int) $freeze_row + 1) . '"/>';
  }
  $xml .= '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="16.5"/><cols>';
  foreach ($cols as $i => $w) $xml .= '<col min="' . ($i + 1) . '" max="' . ($i + 1) . '" width="' . $w . '" customWidth="1"/>';
  $xml .= '</cols><sheetData>';
  foreach ($rows as $r => $cells) {
    $xml .= '<row r="' . $r . '"' . (isset($heights[$r]) ? ' ht="' . $heights[$r] . '" customHeight="1"' : '') . '>' . implode('', $cells) . '</row>';
  }
  $xml .= '</sheetData>';
  if ($filter) $xml .= '<autoFilter ref="' . $filter . '"/>';
  if ($merges) {
    $xml .= '<mergeCells count="' . count($merges) . '">';
    foreach ($merges as $m) $xml .= '<mergeCell ref="' . $m . '"/>';
    $xml .= '</mergeCells>';
  }
  $xml .= '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>'
    . '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
    . '<headerFooter><oddFooter>&amp;LTrang &amp;P / &amp;N&amp;R&amp;D</oddFooter></headerFooter>'
    . '</worksheet>';
  return $xml;
}

function _ptkh_export_workbook(array $sheets) {
  $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    . '<bookViews><workbookView activeTab="0"/></bookViews><sheets>';
  foreach ($sheets as $i => $sheet) {
    $xml .= '<sheet name="' . _ptkh_x($sheet['name']) . '" sheetId="' . ($i + 1) . '" r:id="rId' . ($i + 1) . '"/>';
  }
  $xml .= '</sheets><definedNames>';
  // Bộ lọc của từng sheet cần _FilterDatabase ẩn để Excel nhận đúng vùng lọc khi mở file.
  foreach ($sheets as $i => $sheet) {
    if (preg_match('/<autoFilter ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/', $sheet['xml'], $m)) {
      $quoted = "'" . str_replace("'", "''", $sheet['name']) . "'";
      $xml .= '<definedName name="_xlnm._FilterDatabase" localSheetId="' . $i . '" hidden="1">' . _ptkh_x($quoted . '!$' . $m[1] . '$' . $m[2] . ':$' . $m[3] . '$' . $m[4]) . '</definedName>';
      // In lặp lại dòng tiêu đề bảng ở mọi trang.
      $xml .= '<definedName name="_xlnm.Print_Titles" localSheetId="' . $i . '">' . _ptkh_x($quoted . '!$' . $m[2] . ':$' . $m[2]) . '</definedName>';
    }
  }
  $xml .= '</definedNames></workbook>';
  return str_replace('<definedNames></definedNames>', '', $xml);
}

function _ptkh_export_content_types($sheet_count) {
  $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    . '<Default Extension="xml" ContentType="application/xml"/>'
    . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>';
  for ($i = 1; $i <= $sheet_count; $i++) {
    $xml .= '<Override PartName="/xl/worksheets/sheet' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
  }
  return $xml . '</Types>';
}

/** Chỉ số kiểu ô (thứ tự khớp <cellXfs> trong _ptkh_export_styles()). */
function _ptkh_export_style_ids() {
  return array(
    'default' => 0, 'company' => 1, 'title' => 2, 'subtitle' => 3, 'label' => 4, 'label_right' => 5, 'value' => 6, 'value_bold' => 7,
    'th' => 8, 'td' => 9, 'td_center' => 10, 'td_bold' => 11, 'td_wrap' => 12, 'td_money' => 13, 'td_money_bold' => 14, 'td_number' => 15,
    'total_label' => 16, 'total_money' => 17, 'words' => 18, 'warning' => 19, 'sign_title' => 20, 'sign_hint' => 21, 'sign_name' => 22,
    'title_small' => 23, 'subtitle_left' => 24,
  );
}

function _ptkh_export_styles() {
  // Font: 0 thường, 1 đậm, 2 tiêu đề 16 đậm tím đậm, 3 nghiêng xám nhỏ, 4 đậm trắng, 5 nghiêng, 6 nhãn xám đậm, 7 đậm 12 tím, 8 nghiêng cam, 9 tiêu đề 13 đậm.
  $fonts = array(
    '<font><sz val="11"/><color rgb="FF333333"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><color rgb="FF333333"/><name val="Calibri"/></font>',
    '<font><b/><sz val="16"/><color rgb="FF3D3A8C"/><name val="Calibri"/></font>',
    '<font><i/><sz val="10"/><color rgb="FF6D6B77"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
    '<font><i/><sz val="11"/><color rgb="FF333333"/><name val="Calibri"/></font>',
    '<font><b/><sz val="10"/><color rgb="FF566A7F"/><name val="Calibri"/></font>',
    '<font><b/><sz val="12"/><color rgb="FF3D3A8C"/><name val="Calibri"/></font>',
    '<font><i/><sz val="10"/><color rgb="FFB45309"/><name val="Calibri"/></font>',
    '<font><b/><sz val="13"/><color rgb="FF3D3A8C"/><name val="Calibri"/></font>',
  );
  // Fill: 0 none, 1 gray125 (bắt buộc), 2 tím (tiêu đề bảng), 3 tím nhạt (dòng tổng), 4 xám rất nhạt (khối thông tin).
  $fills = array(
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF7367F0"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEEECFD"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF7F8FA"/><bgColor indexed="64"/></patternFill></fill>',
  );
  // Border: 0 không, 1 mảnh xám quanh ô, 2 dưới đậm (khối thông tin).
  $borders = array(
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    '<border><left style="thin"><color rgb="FFD9DEE7"/></left><right style="thin"><color rgb="FFD9DEE7"/></right><top style="thin"><color rgb="FFD9DEE7"/></top><bottom style="thin"><color rgb="FFD9DEE7"/></bottom><diagonal/></border>',
    '<border><left/><right/><top/><bottom style="hair"><color rgb="FFD9DEE7"/></bottom><diagonal/></border>',
  );
  $al = function ($h, $v = 'center', $wrap = FALSE) {
    return '<alignment horizontal="' . $h . '" vertical="' . $v . '"' . ($wrap ? ' wrapText="1"' : '') . '/>';
  };
  // numFmtId 3 = #,##0 (tiền đồng); 164 = #,##0.## (SL, VAT %).
  $xf = function ($font, $fill, $border, $numfmt, $align) {
    return '<xf numFmtId="' . $numfmt . '" fontId="' . $font . '" fillId="' . $fill . '" borderId="' . $border . '" xfId="0"'
      . ($font ? ' applyFont="1"' : '') . ($fill ? ' applyFill="1"' : '') . ($border ? ' applyBorder="1"' : '') . ($numfmt ? ' applyNumberFormat="1"' : '')
      . ($align ? ' applyAlignment="1">' . $align . '</xf>' : '/>');
  };
  $cell_xfs = array(
    $xf(0, 0, 0, 0, ''),                                   // 0 default
    $xf(1, 0, 0, 0, $al('left')),                          // 1 company
    $xf(2, 0, 0, 0, $al('center')),                        // 2 title
    $xf(3, 0, 0, 0, $al('center')),                        // 3 subtitle
    $xf(6, 4, 2, 0, $al('left', 'center', TRUE)),          // 4 label
    $xf(6, 4, 2, 0, $al('left', 'center', TRUE)),          // 5 label_right
    $xf(0, 4, 2, 0, $al('left', 'center', TRUE)),          // 6 value
    $xf(1, 4, 2, 0, $al('left', 'center', TRUE)),          // 7 value_bold
    $xf(4, 2, 1, 0, $al('center', 'center', TRUE)),        // 8 th
    $xf(0, 0, 1, 0, $al('left')),                          // 9 td
    $xf(0, 0, 1, 0, $al('center')),                        // 10 td_center
    $xf(1, 0, 1, 0, $al('left')),                          // 11 td_bold
    $xf(0, 0, 1, 0, $al('left', 'center', TRUE)),          // 12 td_wrap
    $xf(0, 0, 1, 3, $al('right')),                         // 13 td_money
    $xf(1, 0, 1, 3, $al('right')),                         // 14 td_money_bold
    $xf(0, 0, 1, 164, $al('right')),                       // 15 td_number
    $xf(1, 3, 1, 0, $al('right')),                         // 16 total_label
    $xf(7, 3, 1, 3, $al('right')),                         // 17 total_money
    $xf(5, 0, 0, 0, $al('left', 'center', TRUE)),          // 18 words
    $xf(8, 0, 0, 0, $al('left', 'center', TRUE)),          // 19 warning
    $xf(1, 0, 0, 0, $al('center')),                        // 20 sign_title
    $xf(3, 0, 0, 0, $al('center')),                        // 21 sign_hint
    $xf(1, 0, 0, 0, $al('center')),                        // 22 sign_name
    $xf(9, 0, 0, 0, $al('left')),                          // 23 title_small
    $xf(3, 0, 0, 0, $al('left')),                          // 24 subtitle_left
  );
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    . '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##"/></numFmts>'
    . '<fonts count="' . count($fonts) . '">' . implode('', $fonts) . '</fonts>'
    . '<fills count="' . count($fills) . '">' . implode('', $fills) . '</fills>'
    . '<borders count="' . count($borders) . '">' . implode('', $borders) . '</borders>'
    . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    . '<cellXfs count="' . count($cell_xfs) . '">' . implode('', $cell_xfs) . '</cellXfs>'
    . '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    . '</styleSheet>';
}
