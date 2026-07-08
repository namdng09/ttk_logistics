<div class="accordion-item">
    <h2 class="accordion-header" id="headingTwo">
        <button
                type="button"
                class="accordion-button"
                data-bs-toggle="collapse"
                data-bs-target="#accordionTwo"
                aria-expanded="true"
                aria-controls="accordionTwo">
            Danh sách yêu cầu hàng đóng
        </button>
    </h2>

    <div
            id="accordionTwo"
            class="accordion-collapse collapse show">
        <div class="accordion-body">
            <table class="table table-bordered text-nowrap">
                <?php if (!empty($title) || !empty($caption)): ?>
                    <caption><?php print $caption . $title; ?></caption>
                <?php endif; ?>
                <?php if (!empty($header)) : ?>
                    <thead>
                    <tr>
                        <?php foreach ($header as $field => $label): ?>
                            <th width="<?= $field != 'field_ngay_van_chuyen' ? '1%' : '' ?>" scope="col">
                                <?php print $label; ?>
                            </th>
                        <?php endforeach; ?>
                      <th width="1%">Sửa</th>
                      <th width="1%">Xóa</th>
                    </tr>
                    </thead>
                <?php endif; ?>
                <tbody class="table-border-bottom-0">
                <?php foreach ($rows as $row_count => $row): ?>
                    <tr>
                      <?php $nidChiTiet = null; ?>
                      <?php $nidYeuCau = null; ?>
                        <?php foreach ($row as $field => $content): ?>
                            <td>
                                <?php if ($field == 'field_ngay_van_chuyen'): ?>
                                    <?php print date("d/m/Y", $content); ?>
                                <?php elseif(strpos($content, 'nid') !== FALSE): ?>
                                    <?php
                                    $nidYeuCau = explode(';', $content)[2];
                                    $nidChiTiet = explode(';', $content)[3];
                                    print '<input class="form-check-input" type="checkbox" value="chonYeuCau['.$nidYeuCau.']" data-value="'.$nidYeuCau.'" data-nid-chi-tiet="'.$nidChiTiet.'">';
                                    ?>
                                <?php else: ?>
                                    <?php print $content; ?>
                                <?php endif; ?>
                            </td>
                        <?php endforeach; ?>
                      <td class="text-center"><a href="#" data-value="<?=$nidYeuCau?>" class="btn-sua-yeu-cau text-info"><i class="icon-base ti tabler-edit me-1"></i></a></td>
                      <td class="text-center"><a href="#" data-value="<?=$nidYeuCau?>" class="btn-xoa-yeu-cau text-danger"><i class="icon-base ti tabler-trash me-1"></i></a></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
