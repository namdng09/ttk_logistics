<div class="card">
    <div class="card-header row">
        <div class="col-md-2">
            <h5>
                <?php print drupal_get_title(); ?>
            </h5>
        </div>
        <div class="col-md-10">
<!--            Nút chức năng-->
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-striped text-nowrap" id="phieu-xuat-tbl">
            <?php if (!empty($title) || !empty($caption)): ?>
                <caption><?php print $caption . $title; ?></caption>
            <?php endif; ?>
            <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                    <?php foreach ($header as $field => $label): ?>
                        <th>
                            <?php print $label; ?>
                        </th>
                    <?php endforeach; ?>
                </tr>
                </thead>
            <?php endif; ?>
            <tbody>
            <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                    <?php foreach ($row as $field => $content): ?>
                        <?php if($field == 'nid'): ?>
                            <td class="nid-phieu-xuat">
                                <?php
                                    $arrContent = explode('{{}}', $content);
                                    $nid = $arrContent[0];
                                    $chiTietPhieu = $arrContent[1];

                                    echo '<div data-chi_tiet_phieu="'.htmlspecialchars($chiTietPhieu).'">'.$nid.'</div>';
                                ?>
                            </td>
                        <?php else: ?>
                        <td>
                            <?php print $content ?>
                        </td>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
